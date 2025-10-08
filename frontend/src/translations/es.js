const es = {
  Header: {
    prices: "Precios",
    account: "Mi Cuenta",
    logout: "Cerrar Sesión",
    goToApp: "Ir a la App",
    login: "Iniciar Sesión",
    getStarted: "Comenzar Gratis"
  },
  LandingPage: {
    heroTitlePart1: "Habla con ",
    heroTitleHighlight1: "Confianza",
    heroTitlePart2: ". Comunica con ",
    heroTitleHighlight2: "Impacto",
    heroTitlePart3: ".",
    heroSubtitle: "Transforma tu manera de hablar. Graba tu voz y recibe análisis instantáneos para eliminar muletillas, perfeccionar tu ritmo y modular tu tono como un profesional.",
    heroButton: "Comienza tu Análisis Gratis",
    featuresTitle: "Todo lo que necesitas para mejorar",
    feature1Title: "Graba y Analiza",
    feature1Text: "Simplemente graba tu voz. Nuestra IA analiza tu discurso en segundos, sin complicaciones.",
    feature2Title: "Feedback Accionable",
    feature2Text: "Recibe métricas claras sobre ritmo, muletillas, variación de tono y palabras de duda.",
    feature3Title: "Sigue tu Progreso",
    feature3Text: "Observa cómo mejoras con el tiempo y conviértete en un orador de élite.",
    testimonialText: "\"LucidSpeak cambió mi forma de preparar presentaciones. En una semana, reduje mis 'ehh...' a la mitad y ahora hablo con mucha más seguridad.\"",
    testimonialAuthor: "- Alex, Product Manager",
    finalCtaTitle: "¿Listo para transformar tu voz?",
    finalCtaSubtitle: "Tu primera sesión de análisis es gratis.",
    finalCtaButton: "Crear mi Cuenta"
  },
  Dashboard: {
    title: "Prepárate para Mejorar",
    subtitle: "Presiona el botón para comenzar tu análisis de convicción.",
    startButton: "Comenzar Análisis",
    recentSessions: "Sesiones Recientes",
    viewAll: "Ver todas",
    hide: "Ocultar",
    session: "Sesión",
    pace: "Ritmo",
    tone: "Tono",
    disfluencies: "Disfluencias"
  },
  ReadyToRecord: {
    title: "Nueva Sesión",
    subtitle: "Presiona el micrófono cuando estés listo para comenzar",
    tip: "Tip: Encuentra un lugar tranquilo para obtener los mejores resultados"
  },
  Recording: {
    status: "Grabando... Presiona para detener.",
    stopButton: "Detener"
  },
  Analyzing: {
    title: "Analizando...",
    transcribing: "Transcribiendo audio...",
    analyzing: "Analizando fluidez y convicción...",
    generatingFeedback: "Generando feedback personalizado...",
    complete: "¡Análisis completado!"
  },
  Results: {
    title: "Tu Reporte de Convicción",
    tabs: {
      summary: "Resumen",
      metrics: "Métricas",
      progress: "Progreso"
    },
    insights: {
      title: "Insights Automatizados",
      actions: "Acciones recomendadas",
      exercise: "Ejercicio sugerido",
      notSatisfied: "¿No te convence el resumen?",
      regenerate: "Regenerar insights",
      regenerating: "Generando...",
      close: "Cerrar"
    },
    strengths: "Puntos Fuertes",
    improvements: "Áreas de Mejora",
    noStrengths: "Sigue practicando para identificar tus fortalezas.",
    noImprovements: "¡Gran trabajo! No hemos encontrado áreas críticas para mejorar.",
    radarTitle: "Tu Perfil vs. el Ideal",
    radarLabels: {
      yourPractice: "Tu Práctica",
      idealProfile: "Perfil Ideal"
    },
    metrics: {
      pace: "RITMO",
      paceUnit: "palabras / min",
      paceTooltip: "El ritmo ideal para un discurso claro está entre 130 y 170 palabras por minuto.",
      tone: "TONO",
      toneUnit: "variación",
      toneTooltip: "Una mayor variación de tono hace tu discurso más dinámico. Un valor bajo indica monotonía.",
      hedgeWords: "PALABRAS DE DUDA",
      hedgeTooltip: "Palabras como 'creo que' o 'tal vez' que debilitan tu mensaje. Un orador seguro las evita.",
      disfluencyAnalysis: "Análisis de Disfluencias:"
    },
    history: {
      title: "Tu Historial de Prácticas",
      empty: "Aún no tienes un historial. ¡Completa tu primer análisis para empezar a medir tu progreso!"
    },
    analyzeAgain: "Analizar de Nuevo"
  },
  App: {
    sessions: {
      title: "Tus Sesiones de Práctica",
      subtitle: "Mejora tu comunicación, una práctica a la vez",
      newSession: "Nueva Sesión",
      recordNew: "Grabar Nueva",
      viewHistory: "Ver Historial",
      recordings: "grabación",
      recordingsPlural: "grabaciones",
      noSessions: "No tienes sesiones aún. ¡Crea tu primera sesión para comenzar a practicar y mejorar tus habilidades de comunicación!",
      createFirst: "Crear Primera Sesión",
      stats: {
        sessions: "Sesiones",
        recordings: "Grabaciones",
        active: "Activas"
      }
    },
    recording: {
      ready: "¿Listo para practicar?",
      instructions: "Presiona el botón para comenzar tu grabación. Habla con claridad y naturalidad.",
      startButton: "Comenzar Grabación",
      maxDuration: "Duración máxima: 15 minutos",
      requestingPermission: "Solicitando permiso del micrófono...",
      recording: "Grabando... Presiona para detener.",
      timeRemaining: "Tiempo restante"
    },
    analyzing: {
      title: "Analizando tu voz...",
      uploadingAudio: "Subiendo audio al servidor...",
      transcribing: "Transcribiendo tu grabación...",
      analyzingMetrics: "Analizando métricas vocales...",
      complete: "¡Análisis completo!",
      processing: "Estamos procesando tu audio con IA para darte feedback personalizado..."
    }
  },
  SessionSetup: {
    title: "Nueva Sesión de Práctica",
    nameLabel: "Nombre de la Sesión",
    namePlaceholder: "Ej: Práctica de Pitch Empresarial",
    contextLabel: "Contexto",
    audienceLabel: "Audiencia Objetivo",
    goalLabel: "Objetivo",
    contexts: {
      general: "General",
      salesPitch: "Pitch de Ventas",
      academic: "Académica",
      interview: "Entrevista",
      publicSpeech: "Discurso Público",
      storytelling: "Narrativa"
    },
    audiences: {
      general: "General",
      professionals: "Profesionales",
      students: "Estudiantes",
      executives: "Ejecutivos",
      peers: "Compañeros"
    },
    goals: {
      inform: "Informar",
      persuade: "Persuadir",
      entertain: "Entretener",
      inspire: "Inspirar",
      teach: "Enseñar"
    },
    cancel: "Cancelar",
    create: "Crear Sesión"
  },
  UserTier: {
    freePlan: "Plan Gratuito",
    proPlan: "Plan Pro",
    minutesAnalyzed: "minutos analizados",
    minutesUsed: "minutos usados",
    upgradeToPro: "Actualizar a Pro"
  },
  Auth: {
    login: {
      title: "Iniciar Sesión",
      email: "Correo Electrónico",
      password: "Contraseña",
      rememberMe: "Recordarme",
      forgotPassword: "¿Olvidaste tu contraseña?",
      submit: "Iniciar Sesión",
      noAccount: "¿No tienes cuenta?",
      signUp: "Regístrate aquí"
    },
    register: {
      title: "Crear Cuenta",
      email: "Correo Electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar Contraseña",
      requirements: "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo.",
      submit: "Crear Cuenta",
      haveAccount: "¿Ya tienes cuenta?",
      login: "Inicia sesión aquí"
    }
  },
  Common: {
    loading: "Cargando...",
    error: "Error",
    success: "Éxito",
    cancel: "Cancelar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    close: "Cerrar"
  }
};

export default es;
