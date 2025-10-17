# ==============================================================================
# JOB QUEUE SYSTEM
# Handles async processing of audio analysis to avoid blocking requests
# ==============================================================================

import asyncio
import uuid
from typing import Dict, Any, Optional, Callable
from enum import Enum
from datetime import datetime
import json

class JobStatus(str, Enum):
    """Job status enumeration."""
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Job:
    """Represents an analysis job."""
    
    def __init__(self, job_id: str, user_id: str, audio_path: str, transcript: str, **kwargs):
        self.id = job_id
        self.user_id = user_id
        self.audio_path = audio_path
        self.transcript = transcript
        self.status = JobStatus.QUEUED
        self.created_at = datetime.now()
        self.started_at: Optional[datetime] = None
        self.completed_at: Optional[datetime] = None
        self.result: Optional[Dict[str, Any]] = None
        self.error: Optional[str] = None
        self.progress: float = 0.0  # 0-100
        self.metadata = kwargs
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "status": self.status.value,
            "progress": self.progress,
            "created_at": self.created_at.isoformat(),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "result": self.result,
            "error": self.error,
            "metadata": self.metadata
        }


class JobQueue:
    """
    Manages async job processing queue.
    
    Allows uploads to return immediately with job_id,
    while processing happens in background.
    """
    
    def __init__(self, max_concurrent_workers: int = 2):
        """
        Initialize job queue.
        
        Args:
            max_concurrent_workers: Number of concurrent jobs to process
        """
        self.jobs: Dict[str, Job] = {}
        self.queue: asyncio.Queue = asyncio.Queue()
        self.max_workers = max_concurrent_workers
        self.active_workers = 0
        self._workers_started = False
    
    async def add_job(
        self,
        user_id: str,
        audio_path: str,
        transcript: str,
        **metadata
    ) -> str:
        """
        Add a new job to the queue.
        
        Returns:
            Job ID (can be used to poll for results)
        """
        job_id = str(uuid.uuid4())
        job = Job(
            job_id=job_id,
            user_id=user_id,
            audio_path=audio_path,
            transcript=transcript,
            **metadata
        )
        
        self.jobs[job_id] = job
        await self.queue.put(job_id)
        
        # Start workers if not already running
        if not self._workers_started:
            await self._start_workers()
        
        return job_id
    
    async def _start_workers(self):
        """Start background worker tasks."""
        if self._workers_started:
            return
        
        self._workers_started = True
        
        for i in range(self.max_workers):
            asyncio.create_task(self._worker())
    
    async def _worker(self):
        """Background worker that processes jobs from queue."""
        while True:
            try:
                job_id = await self.queue.get()
                await self._process_job(job_id)
                self.queue.task_done()
            except Exception as e:
                print(f"❌ Worker error: {str(e)}")
                await asyncio.sleep(1)  # Avoid tight loop on error
    
    async def _process_job(self, job_id: str):
        """Process a single job."""
        if job_id not in self.jobs:
            print(f"⚠️  Job {job_id} not found")
            return
        
        job = self.jobs[job_id]
        job.status = JobStatus.PROCESSING
        job.started_at = datetime.now()
        job.progress = 10
        
        try:
            # Import here to avoid circular imports
            from .pro_analyzer import analyze_audio_for_pro_user
            
            job.progress = 20
            
            # Run analysis
            result = await analyze_audio_for_pro_user(
                audio_path=job.audio_path,
                transcript=job.transcript,
                context=job.metadata.get("context", "general"),
                language=job.metadata.get("language", "en")
            )
            
            job.progress = 90
            job.result = result
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.now()
            job.progress = 100
            
            print(f"✅ Job {job_id} completed in {(job.completed_at - job.started_at).total_seconds():.1f}s")
        
        except Exception as e:
            job.status = JobStatus.FAILED
            job.error = str(e)
            job.completed_at = datetime.now()
            print(f"❌ Job {job_id} failed: {str(e)}")
    
    def get_job(self, job_id: str) -> Optional[Job]:
        """Get a job by ID."""
        return self.jobs.get(job_id)
    
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job status as dictionary."""
        job = self.get_job(job_id)
        if not job:
            return None
        return job.to_dict()
    
    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a queued job."""
        job = self.get_job(job_id)
        if not job:
            return False
        
        if job.status == JobStatus.QUEUED:
            job.status = JobStatus.CANCELLED
            return True
        
        # Can't cancel jobs already processing
        return False
    
    def get_user_jobs(self, user_id: str) -> list:
        """Get all jobs for a user."""
        return [
            job.to_dict()
            for job in self.jobs.values()
            if job.user_id == user_id
        ]
    
    def cleanup_old_jobs(self, max_age_hours: int = 24):
        """Remove completed jobs older than max_age_hours."""
        from datetime import timedelta
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        
        to_remove = [
            job_id for job_id, job in self.jobs.items()
            if job.completed_at and job.completed_at < cutoff
        ]
        
        for job_id in to_remove:
            del self.jobs[job_id]
        
        return len(to_remove)


# Global job queue instance
_job_queue: Optional[JobQueue] = None


def get_job_queue() -> JobQueue:
    """Get or create global job queue."""
    global _job_queue
    if _job_queue is None:
        _job_queue = JobQueue(max_concurrent_workers=2)
    return _job_queue


async def add_analysis_job(
    user_id: str,
    audio_path: str,
    transcript: str,
    context: str = "general",
    language: str = "en"
) -> str:
    """
    Convenience function to add an analysis job.
    
    Usage:
        job_id = await add_analysis_job(
            user_id="user123",
            audio_path="/tmp/audio.wav",
            transcript="Hello world...",
            context="presentation"
        )
        
        # Later, poll for results:
        job_status = get_job_queue().get_job_status(job_id)
    """
    queue = get_job_queue()
    return await queue.add_job(
        user_id=user_id,
        audio_path=audio_path,
        transcript=transcript,
        context=context,
        language=language
    )
