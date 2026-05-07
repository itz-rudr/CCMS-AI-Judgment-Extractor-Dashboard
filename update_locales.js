const fs = require('fs');

const updates = {
  en: {
    dashboard: {
      view_case: "View Case",
      assign_officer: "Assign Officer",
      escalate: "Escalate",
      limitation_date: "Limitation Date",
      critical_risk: "Critical Risk",
      high_risk: "High Risk",
      department: "Department",
      compliance_score: "Compliance Score",
      approved: "Approved",
      overdue_lowercase: "overdue"
    },
    filters: {
      all_departments: "All Departments",
      departments: "Departments",
      dates: "Dates",
      filters: "Filters",
      clear_all: "Clear All"
    },
    departments: {
      revenue_department: "Revenue Department",
      education_department: "Education Department",
      urban_development: "Urban Development",
      finance_department: "Finance Department",
      health_department: "Health Department"
    },
    login: {
      welcome: "Welcome Back",
      subtitle: "Sign in to access the Judgment Desk",
      email: "Email Address",
      password: "Password",
      sign_in: "Sign In",
      signing_in: "Signing in...",
      invalid_creds: "Invalid email or password",
      remember_me: "Remember me"
    },
    nav: {
      logout: "Logout"
    }
  },
  hi: {
    dashboard: {
      view_case: "केस देखें",
      assign_officer: "अधिकारी सौंपें",
      escalate: "एस्केलेट करें",
      limitation_date: "सीमा तिथि",
      critical_risk: "गंभीर जोखिम",
      high_risk: "उच्च जोखिम",
      department: "विभाग",
      compliance_score: "अनुपालन स्कोर",
      approved: "अनुमोदित",
      overdue_lowercase: "अतिदेय"
    },
    filters: {
      all_departments: "सभी विभाग",
      departments: "विभाग",
      dates: "तिथियां",
      filters: "फिल्टर",
      clear_all: "सभी साफ़ करें"
    },
    departments: {
      revenue_department: "राजस्व विभाग",
      education_department: "शिक्षा विभाग",
      urban_development: "शहरी विकास",
      finance_department: "वित्त विभाग",
      health_department: "स्वास्थ्य विभाग"
    },
    login: {
      welcome: "वापसी पर स्वागत है",
      subtitle: "जजमेंट डेस्क तक पहुंचने के लिए साइन इन करें",
      email: "ईमेल पता",
      password: "पासवर्ड",
      sign_in: "साइन इन करें",
      signing_in: "साइन इन हो रहा है...",
      invalid_creds: "अमान्य ईमेल या पासवर्ड",
      remember_me: "मुझे याद रखें"
    },
    nav: {
      logout: "लॉग आउट"
    }
  },
  kn: {
    dashboard: {
      view_case: "ಪ್ರಕರಣ ವೀಕ್ಷಿಸಿ",
      assign_officer: "ಅಧಿಕಾರಿ ನಿಯೋಜಿಸಿ",
      escalate: "ಮೇಲಧಿಕಾರಿಗೆ ಕಳುಹಿಸಿ",
      limitation_date: "ಮಿತಿ ದಿನಾಂಕ",
      critical_risk: "ಗಂಭೀರ ಅಪಾಯ",
      high_risk: "ಹೆಚ್ಚಿನ ಅಪಾಯ",
      department: "ಇಲಾಖೆ",
      compliance_score: "ಅನುಸರಣೆ ಸ್ಕೋರ್",
      approved: "ಅನುಮೋದಿಸಲಾಗಿದೆ",
      overdue_lowercase: "ಅವಧಿ ಮೀರಿದೆ"
    },
    filters: {
      all_departments: "ಎಲ್ಲಾ ಇಲಾಖೆಗಳು",
      departments: "ಇಲಾಖೆಗಳು",
      dates: "ದಿನಾಂಕಗಳು",
      filters: "ಫಿಲ್ಟರ್‌ಗಳು",
      clear_all: "ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ"
    },
    departments: {
      revenue_department: "ಕಂದಾಯ ಇಲಾಖೆ",
      education_department: "ಶಿಕ್ಷಣ ಇಲಾಖೆ",
      urban_development: "ನಗರಾಭಿವೃದ್ಧಿ",
      finance_department: "ಹಣಕಾಸು ಇಲಾಖೆ",
      health_department: "ಆರೋಗ್ಯ ಇಲಾಖೆ"
    },
    login: {
      welcome: "ಮರಳಿ ಸ್ವಾಗತ",
      subtitle: "ಜಡ್ಜ್ಮೆಂಟ್ ಡೆಸ್ಕ್ ಪ್ರವೇಶಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ",
      email: "ಇಮೇಲ್ ವಿಳಾಸ",
      password: "ಪಾಸ್ವರ್ಡ್",
      sign_in: "ಸೈನ್ ಇನ್ ಮಾಡಿ",
      signing_in: "ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ...",
      invalid_creds: "ಅಮಾನ್ಯ ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್ವರ್ಡ್",
      remember_me: "ನನ್ನನ್ನು ನೆನಪಿನಲ್ಲಿಡಿ"
    },
    nav: {
      logout: "ಲಾಗ್ ಔಟ್"
    }
  }
};

const locales = ['en', 'hi', 'kn'];

locales.forEach(lang => {
  const file = `./locales/${lang}.json`;
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    // Merge dashboard
    data.dashboard = { ...data.dashboard, ...updates[lang].dashboard };
    // Merge filters
    data.filters = { ...data.filters, ...updates[lang].filters };
    // Add departments
    data.departments = { ...data.departments, ...updates[lang].departments };
    // Add login
    data.login = { ...data.login, ...updates[lang].login };
    // Merge nav (for logout)
    data.nav = { ...data.nav, ...updates[lang].nav };
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${lang}.json`);
  }
});
