# Translation Usage Guide

## Quick Reference

### 1. Import the Hook
```javascript
import { useTranslations } from 'next-intl';
```

### 2. Use in Component
```javascript
const MyComponent = () => {
    const t = useTranslations('SectionName');
    
    return <h1>{t('title')}</h1>;
};
```

## Available Translation Sections

### Header
```javascript
const t = useTranslations('Header');
// Keys: prices, account, logout, goToApp, login, getStarted
```

### Landing Page
```javascript
const t = useTranslations('LandingPage');
// Keys: heroTitlePart1, heroTitleHighlight1, heroButton, etc.
```

### Dashboard
```javascript
const t = useTranslations('Dashboard');
// Keys: title, subtitle, startButton, recentSessions, viewAll, hide, pace, tone, disfluencies
```

### Ready to Record
```javascript
const t = useTranslations('ReadyToRecord');
// Keys: title, subtitle, tip
```

### Recording
```javascript
const t = useTranslations('Recording');
// Keys: status, stopButton
```

### Analyzing
```javascript
const t = useTranslations('Analyzing');
// Keys: title, transcribing, analyzing, generatingFeedback, complete
```

### Results
```javascript
const t = useTranslations('Results');
// Keys: title, tabs.summary, tabs.metrics, tabs.progress
// insights.title, insights.actions, insights.exercise
// strengths, improvements, analyzeAgain
```

### Session Setup
```javascript
const t = useTranslations('SessionSetup');
// Keys: title, nameLabel, namePlaceholder, contextLabel, audienceLabel, goalLabel
// contexts.general, contexts.salesPitch, etc.
// audiences.general, audiences.professionals, etc.
// goals.inform, goals.persuade, etc.
```

### User Tier
```javascript
const t = useTranslations('UserTier');
// Keys: freePlan, proPlan, minutesAnalyzed, minutesUsed, upgradeToPro
```

### Authentication
```javascript
const t = useTranslations('Auth.login');
// Keys: title, email, password, rememberMe, forgotPassword, submit, noAccount, signUp

const t = useTranslations('Auth.register');
// Keys: title, email, password, confirmPassword, requirements, submit, haveAccount, login
```

### Common
```javascript
const t = useTranslations('Common');
// Keys: loading, error, success, cancel, save, delete, edit, close
```

## Examples

### Simple Usage
```javascript
const LoginPage = () => {
    const t = useTranslations('Auth.login');
    
    return (
        <form>
            <h1>{t('title')}</h1>
            <input placeholder={t('email')} />
            <button>{t('submit')}</button>
        </form>
    );
};
```

### With Dynamic Content
```javascript
const AnalyzingUI = ({ status }) => {
    const t = useTranslations('Analyzing');
    
    return (
        <div>
            <h2>{t('title')}</h2>
            <p>{loading ? `${t('transcribing')}...` : t('complete')}</p>
        </div>
    );
};
```

### Multiple Sections
```javascript
const Dashboard = () => {
    const tDashboard = useTranslations('Dashboard');
    const tCommon = useTranslations('Common');
    
    return (
        <div>
            <h1>{tDashboard('title')}</h1>
            {loading && <p>{tCommon('loading')}</p>}
        </div>
    );
};
```

## Adding New Translations

### Step 1: Add to Spanish
**File**: `frontend/src/translations/es.js`
```javascript
const es = {
    // ... existing sections
    MyNewSection: {
        title: "Mi Título",
        description: "Mi Descripción",
        button: "Botón de Acción"
    }
};
```

### Step 2: Add to English
**File**: `frontend/src/translations/en.js`
```javascript
const en = {
    // ... existing sections
    MyNewSection: {
        title: "My Title",
        description: "My Description",
        button: "Action Button"
    }
};
```

### Step 3: Use in Component
```javascript
import { useTranslations } from 'next-intl';

const MyComponent = () => {
    const t = useTranslations('MyNewSection');
    
    return (
        <div>
            <h1>{t('title')}</h1>
            <p>{t('description')}</p>
            <button>{t('button')}</button>
        </div>
    );
};
```

## Best Practices

### 1. Organize by Feature
```javascript
// Good: Organized by component/feature
Dashboard: {
    title: "...",
    subtitle: "..."
}

// Bad: Flat structure
dashboardTitle: "...",
dashboardSubtitle: "..."
```

### 2. Use Nested Keys for Related Content
```javascript
Results: {
    tabs: {
        summary: "Resumen",
        metrics: "Métricas",
        progress: "Progreso"
    }
}

// Usage:
const t = useTranslations('Results');
<Tab>{t('tabs.summary')}</Tab>
```

### 3. Keep Keys Consistent Across Languages
```javascript
// es.js
Auth: {
    login: {
        title: "Iniciar Sesión"
    }
}

// en.js
Auth: {
    login: {
        title: "Log In"  // Same key structure
    }
}
```

### 4. Avoid Hardcoded Text
```javascript
// ❌ Bad
<h1>Dashboard</h1>

// ✅ Good
const t = useTranslations('Dashboard');
<h1>{t('title')}</h1>
```

## Testing Translations

### 1. Switch Language in URL
- Spanish: `http://localhost:3000/es/dashboard`
- English: `http://localhost:3000/en/dashboard`

### 2. Verify All Text Changes
Check that:
- Buttons update
- Labels update
- Error messages update
- Placeholders update

### 3. Check for Missing Keys
If a key is missing, Next-intl will show the key name instead of translated text:
```
// If "newButton" doesn't exist:
<button>{t('newButton')}</button>
// Renders: <button>newButton</button>
```

## Common Patterns

### Conditional Text
```javascript
const t = useTranslations('Common');
<button>{loading ? t('loading') : t('save')}</button>
```

### Lists/Arrays
```javascript
const t = useTranslations('SessionSetup.contexts');
const contexts = ['general', 'salesPitch', 'academic'];

contexts.map(key => (
    <option key={key} value={key}>
        {t(key)}
    </option>
))
```

### Error Messages
```javascript
const t = useTranslations('Common');
{error && <p className="text-red-500">{t('error')}: {error}</p>}
```

## Troubleshooting

### Translation Not Showing?
1. Check key exists in both es.js and en.js
2. Verify correct section name in useTranslations()
3. Make sure translation files are imported correctly
4. Check browser console for errors

### Wrong Language Displaying?
1. Check URL path (/es/ or /en/)
2. Verify locale detection in layout
3. Clear browser cache

### Nested Keys Not Working?
```javascript
// Use dot notation
const t = useTranslations('Results');
t('tabs.summary')  // ✅ Correct

// Don't use separate calls
const t = useTranslations('Results.tabs');
t('summary')  // ❌ Won't work with current structure
```
