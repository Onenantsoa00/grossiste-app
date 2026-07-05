const routes = [
  {
    path: '/',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/login'
      },
      {
        path: 'login',
        component: () => import('pages/LoginPage.vue'),
        meta: { guest: true }
      },
      {
        path: 'register',
        component: () => import('pages/RegisterPage.vue'),
        meta: { guest: true }
      },
      {
        path: 'forgot-password',
        component: () => import('pages/ForgotPasswordPage.vue'),
        meta: { guest: true }
      }
    ]
  },
  {
    path: '/boss',
    component: () => import('layouts/BossLayout.vue'),
    meta: { requiresAuth: true, requiresBoss: true },
    children: [
      {
        path: '',
        name: 'boss-dashboard',
        component: () => import('pages/boss/DashboardPage.vue')
      },
      {
        path: 'grossistes',
        name: 'boss-grossistes',
        component: () => import('pages/boss/GrossistesPage.vue')
      },
      {
        path: 'employes',
        name: 'boss-employes',
        component: () => import('pages/boss/EmployesPage.vue')
      }
    ]
  },
  {
    path: '/employe',
    component: () => import('layouts/EmployeLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'employe-dashboard',
        component: () => import('pages/employe/DashboardPage.vue')
      }
    ]
  },
  {
    path: '/grossiste',
    component: () => import('layouts/GrossisteLayout.vue'),
    meta: { requiresAuth: true, requiresGrossiste: true },
    children: [
      {
        path: '',
        name: 'grossiste-dashboard',
        component: () => import('pages/grossiste/DashboardPage.vue')
      },
      {
        path: 'produits',
        name: 'grossiste-produits',
        component: () => import('pages/grossiste/ProduitsPage.vue')
      },
      {
        path: 'clients',
        name: 'grossiste-clients',
        component: () => import('pages/grossiste/ClientsPage.vue')
      },
      {
        path: 'fournisseurs',
        name: 'grossiste-fournisseurs',
        component: () => import('pages/grossiste/FournisseursPage.vue')
      },
      {
        path: 'stock',
        name: 'grossiste-stock',
        component: () => import('pages/grossiste/StockPage.vue')
      },
      {
        path: 'ventes',
        name: 'grossiste-ventes',
        component: () => import('pages/grossiste/VentesPage.vue')
      }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
