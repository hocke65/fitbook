import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  sv: {
    // Navigation
    nav: {
      classes: 'Träningspass',
      myBookings: 'Mina Bokningar',
      admin: 'Admin',
      login: 'Logga in',
      register: 'Registrera',
      logout: 'Logga ut',
    },
    // Common
    common: {
      loading: 'Laddar...',
      save: 'Spara',
      saving: 'Sparar...',
      cancel: 'Avbryt',
      delete: 'Ta bort',
      edit: 'Redigera',
      create: 'Skapa',
      update: 'Uppdatera',
      confirm: 'Bekräfta',
      yes: 'Ja',
      no: 'Nej',
      error: 'Fel',
      success: 'Lyckades',
      noResults: 'Inga resultat',
    },
    // Auth
    auth: {
      email: 'E-postadress',
      password: 'Lösenord',
      firstName: 'Förnamn',
      lastName: 'Efternamn',
      loginTitle: 'Logga in',
      loginSubtitle: 'Välkommen tillbaka!',
      loginButton: 'Logga in',
      registerTitle: 'Skapa konto',
      registerSubtitle: 'Kom igång med din träning',
      registerButton: 'Skapa konto',
      noAccount: 'Har du inget konto?',
      hasAccount: 'Har du redan ett konto?',
      createAccount: 'Skapa ett här',
      loginHere: 'Logga in här',
      loggingIn: 'Loggar in...',
      registering: 'Skapar konto...',
    },
    // Classes
    classes: {
      title: 'Träningspass',
      available: 'pass tillgängliga',
      booked: 'bokade',
      noClasses: 'Inga pass tillgängliga',
      noClassesText: 'Just nu finns inga kommande träningspass schemalagda. Kom tillbaka senare!',
      bookButton: 'Boka pass',
      cancelButton: 'Avboka',
      booking: 'Bokar...',
      cancelling: 'Avbokar...',
      fullyBooked: 'Fullbokat',
      youAreBooked: 'Du är bokad',
      spotsBooked: 'bokade',
      spotsAvailable: 'lediga',
      showParticipants: 'Visa deltagare',
      hideParticipants: 'Dölj deltagare',
      loadingParticipants: 'Laddar deltagare...',
      noParticipants: 'Inga bokade deltagare ännu',
      participants: 'Bokade deltagare',
      today: 'Idag',
      tomorrow: 'Imorgon',
      minutes: 'min',
      instructor: 'Instruktör',
    },
    // Calendar
    calendar: {
      calendar: 'Kalender',
      list: 'Lista',
      calendarView: 'Kalendervy',
      listView: 'Listvy',
      today: 'Idag',
      month: 'Månad',
      week: 'Vecka',
      day: 'Dag',
      spotsLeft: 'platser kvar',
      noClassesThisDay: 'Inga pass denna dag',
    },
    // My Bookings
    myBookings: {
      title: 'Mina Bokningar',
      youHave: 'Du har',
      upcoming: 'kommande',
      bookingSingular: 'bokning',
      bookingPlural: 'bokningar',
      noUpcoming: 'Inga kommande bokningar',
      noBookings: 'Inga bokningar',
      noBookingsText: 'Du har inga kommande bokade träningspass. Hitta ett pass som passar dig!',
      browseClasses: 'Bläddra bland pass',
      booked: 'Bokad',
      loadingBookings: 'Laddar dina bokningar...',
    },
    // Admin
    admin: {
      title: 'Admin Dashboard',
      subtitle: 'Hantera träningspass och användare',
      tabClasses: 'Träningspass',
      tabUsers: 'Användare',
      // Stats
      activeClasses: 'Aktiva pass',
      totalBooked: 'Totalt bokade',
      totalCapacity: 'Total kapacitet',
      occupancy: 'Beläggning',
      totalUsers: 'Totalt användare',
      administrators: 'Administratörer',
      regularUsers: 'Vanliga användare',
      activeBookings: 'Aktiva bokningar',
      // Classes
      classesTitle: 'Träningspass',
      createClass: 'Skapa nytt pass',
      createClassButton: 'Skapa pass',
      editClass: 'Redigera pass',
      noClasses: 'Inga pass',
      noClassesText: 'Skapa ditt första träningspass!',
      classTitle: 'Titel',
      classTitlePlaceholder: 'T.ex. Yoga för nybörjare',
      classDescription: 'Beskrivning',
      classDescriptionPlaceholder: 'Beskriv passet...',
      instructor: 'Instruktör',
      instructorPlaceholder: 'Instruktörens namn',
      dateTime: 'Datum och tid',
      maxCapacity: 'Max antal platser',
      duration: 'Längd (minuter)',
      classUpdated: 'Passet har uppdaterats!',
      classCreated: 'Nytt pass har skapats!',
      classDeleted: 'Passet har tagits bort!',
      confirmDeleteClass: 'Är du säker på att du vill ta bort "{title}"?',
      viewParticipants: 'Visa deltagare',
      participants: 'Deltagare',
      noBookingsYet: 'Inga bokningar ännu.',
      bookedParticipants: 'bokade deltagare',
      bookedAt: 'Bokad',
      // Users
      usersTitle: 'Användare',
      createUser: 'Skapa ny användare',
      createUserButton: 'Skapa användare',
      editUser: 'Redigera användare',
      noUsers: 'Inga användare',
      noUsersText: 'Skapa din första användare!',
      loadingUsers: 'Laddar användare...',
      emailPlaceholder: 'namn@example.com',
      roleAdmin: 'Admin',
      roleAdminOption: 'Administratör',
      roleUser: 'Användare',
      newPassword: 'Nytt lösenord (lämna tomt för att behålla)',
      passwordPlaceholder: 'Minst 6 tecken',
      userUpdated: 'Användaren har uppdaterats!',
      userCreated: 'Ny användare har skapats!',
      userDeleted: 'Användaren har tagits bort!',
      confirmDeleteUser: 'Är du säker på att du vill ta bort "{name}"? Alla bokningar för användaren kommer också att tas bort.',
      memberSince: 'Medlem sedan',
      // Table headers
      tableClass: 'Pass',
      tableDateTime: 'Datum/Tid',
      tableBooked: 'Bokade',
      tableCapacity: 'Kapacitet',
      tableActions: 'Åtgärder',
      tableUser: 'Användare',
      tableEmail: 'E-post',
      tableRole: 'Roll',
      tableBookings: 'Bokningar',
    },
    // Errors
    errors: {
      fetchClasses: 'Kunde inte hämta träningspass.',
      fetchBookings: 'Kunde inte hämta bokningar.',
      fetchUsers: 'Kunde inte hämta användare.',
      fetchParticipants: 'Kunde inte hämta deltagare.',
      bookingFailed: 'Kunde inte boka passet.',
      cancelFailed: 'Kunde inte avboka passet.',
      generic: 'Något gick fel.',
      deleteClass: 'Kunde inte ta bort passet.',
      deleteUser: 'Kunde inte ta bort användaren.',
      loginFailed: 'Inloggningen misslyckades.',
      registerFailed: 'Registreringen misslyckades.',
    },
  },
  en: {
    // Navigation
    nav: {
      classes: 'Classes',
      myBookings: 'My Bookings',
      admin: 'Admin',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
    },
    // Common
    common: {
      loading: 'Loading...',
      save: 'Save',
      saving: 'Saving...',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      update: 'Update',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      error: 'Error',
      success: 'Success',
      noResults: 'No results',
    },
    // Auth
    auth: {
      email: 'Email address',
      password: 'Password',
      firstName: 'First name',
      lastName: 'Last name',
      loginTitle: 'Login',
      loginSubtitle: 'Welcome back!',
      loginButton: 'Login',
      registerTitle: 'Create account',
      registerSubtitle: 'Get started with your training',
      registerButton: 'Create account',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      createAccount: 'Create one here',
      loginHere: 'Login here',
      loggingIn: 'Logging in...',
      registering: 'Creating account...',
    },
    // Classes
    classes: {
      title: 'Classes',
      available: 'classes available',
      booked: 'booked',
      noClasses: 'No classes available',
      noClassesText: 'There are currently no upcoming classes scheduled. Check back later!',
      bookButton: 'Book class',
      cancelButton: 'Cancel',
      booking: 'Booking...',
      cancelling: 'Cancelling...',
      fullyBooked: 'Fully booked',
      youAreBooked: 'You are booked',
      spotsBooked: 'booked',
      spotsAvailable: 'available',
      showParticipants: 'Show participants',
      hideParticipants: 'Hide participants',
      loadingParticipants: 'Loading participants...',
      noParticipants: 'No participants booked yet',
      participants: 'Booked participants',
      today: 'Today',
      tomorrow: 'Tomorrow',
      minutes: 'min',
      instructor: 'Instructor',
    },
    // Calendar
    calendar: {
      calendar: 'Calendar',
      list: 'List',
      calendarView: 'Calendar view',
      listView: 'List view',
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      spotsLeft: 'spots left',
      noClassesThisDay: 'No classes this day',
    },
    // My Bookings
    myBookings: {
      title: 'My Bookings',
      youHave: 'You have',
      upcoming: 'upcoming',
      bookingSingular: 'booking',
      bookingPlural: 'bookings',
      noUpcoming: 'No upcoming bookings',
      noBookings: 'No bookings',
      noBookingsText: 'You have no upcoming booked classes. Find a class that suits you!',
      browseClasses: 'Browse classes',
      booked: 'Booked',
      loadingBookings: 'Loading your bookings...',
    },
    // Admin
    admin: {
      title: 'Admin Dashboard',
      subtitle: 'Manage classes and users',
      tabClasses: 'Classes',
      tabUsers: 'Users',
      // Stats
      activeClasses: 'Active classes',
      totalBooked: 'Total booked',
      totalCapacity: 'Total capacity',
      occupancy: 'Occupancy',
      totalUsers: 'Total users',
      administrators: 'Administrators',
      regularUsers: 'Regular users',
      activeBookings: 'Active bookings',
      // Classes
      classesTitle: 'Classes',
      createClass: 'Create new class',
      createClassButton: 'Create class',
      editClass: 'Edit class',
      noClasses: 'No classes',
      noClassesText: 'Create your first class!',
      classTitle: 'Title',
      classTitlePlaceholder: 'E.g. Yoga for beginners',
      classDescription: 'Description',
      classDescriptionPlaceholder: 'Describe the class...',
      instructor: 'Instructor',
      instructorPlaceholder: "Instructor's name",
      dateTime: 'Date and time',
      maxCapacity: 'Max capacity',
      duration: 'Duration (minutes)',
      classUpdated: 'Class has been updated!',
      classCreated: 'New class has been created!',
      classDeleted: 'Class has been deleted!',
      confirmDeleteClass: 'Are you sure you want to delete "{title}"?',
      viewParticipants: 'View participants',
      participants: 'Participants',
      noBookingsYet: 'No bookings yet.',
      bookedParticipants: 'booked participants',
      bookedAt: 'Booked',
      // Users
      usersTitle: 'Users',
      createUser: 'Create new user',
      createUserButton: 'Create user',
      editUser: 'Edit user',
      noUsers: 'No users',
      noUsersText: 'Create your first user!',
      loadingUsers: 'Loading users...',
      emailPlaceholder: 'name@example.com',
      roleAdmin: 'Admin',
      roleAdminOption: 'Administrator',
      roleUser: 'User',
      newPassword: 'New password (leave empty to keep current)',
      passwordPlaceholder: 'At least 6 characters',
      userUpdated: 'User has been updated!',
      userCreated: 'New user has been created!',
      userDeleted: 'User has been deleted!',
      confirmDeleteUser: 'Are you sure you want to delete "{name}"? All bookings for this user will also be deleted.',
      memberSince: 'Member since',
      // Table headers
      tableClass: 'Class',
      tableDateTime: 'Date/Time',
      tableBooked: 'Booked',
      tableCapacity: 'Capacity',
      tableActions: 'Actions',
      tableUser: 'User',
      tableEmail: 'Email',
      tableRole: 'Role',
      tableBookings: 'Bookings',
    },
    // Errors
    errors: {
      fetchClasses: 'Could not fetch classes.',
      fetchBookings: 'Could not fetch bookings.',
      fetchUsers: 'Could not fetch users.',
      fetchParticipants: 'Could not fetch participants.',
      bookingFailed: 'Could not book the class.',
      cancelFailed: 'Could not cancel the booking.',
      generic: 'Something went wrong.',
      deleteClass: 'Could not delete the class.',
      deleteUser: 'Could not delete the user.',
      loginFailed: 'Login failed.',
      registerFailed: 'Registration failed.',
    },
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'sv';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'sv' ? 'en' : 'sv');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
