import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export function formatMontant (value) {
  const num = parseFloat(value || 0)
  return new Intl.NumberFormat('fr-MG').format(num) + ' Ar'
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    bossStats: null,
    bossGrossistes: [],
    employeData: null,
    grossisteData: null,
    loading: false
  }),

  actions: {
    async fetchBossDashboard () {
      this.loading = true
      try {
        const { data } = await api.get('/dashboard/boss')
        this.bossStats = data.stats
        this.bossGrossistes = data.grossistes
      } finally {
        this.loading = false
      }
    },

    async fetchEmployeDashboard () {
      this.loading = true
      try {
        const { data } = await api.get('/dashboard/employe')
        this.employeData = data
      } finally {
        this.loading = false
      }
    },

    async fetchGrossisteDashboard (grossisteId) {
      this.loading = true
      try {
        const { data } = await api.get(`/dashboard/grossiste/${grossisteId}`)
        this.grossisteData = data
      } finally {
        this.loading = false
      }
    }
  }
})
