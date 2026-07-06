<template>
  <div class="ventes-chart">
    <div v-if="!items.length" class="text-grey-6 text-center q-pa-md">
      Aucune vente enregistrée pour afficher le graphique
    </div>
    <div v-else class="q-gutter-sm">
      <div v-for="item in items" :key="item.nom" class="chart-row">
        <div class="chart-label text-caption ellipsis" :title="item.nom">{{ item.nom }}</div>
        <div class="chart-bar-wrap">
          <div
            class="chart-bar"
            :style="{ width: barWidth(item.quantite_vendue) + '%' }"
          />
        </div>
        <div class="chart-value text-caption text-weight-medium">{{ formatQty(item.quantite_vendue) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'VentesBarChart',
  props: {
    data: { type: Array, default: () => [] }
  },
  setup (props) {
    const items = computed(() => props.data || [])

    const maxQty = computed(() => {
      if (!items.value.length) return 1
      return Math.max(...items.value.map(i => parseFloat(i.quantite_vendue) || 0), 1)
    })

    function barWidth (qty) {
      const pct = (parseFloat(qty) / maxQty.value) * 100
      return Math.max(pct, 4)
    }

    function formatQty (q) {
      const n = parseFloat(q)
      return Number.isInteger(n) ? n : n.toFixed(1)
    }

    return { items, barWidth, formatQty }
  }
}
</script>

<style scoped>
.chart-row {
  display: grid;
  grid-template-columns: 120px 1fr 48px;
  gap: 8px;
  align-items: center;
}

@media (max-width: 599px) {
  .chart-row {
    grid-template-columns: 80px 1fr 40px;
  }
}

.chart-label {
  max-width: 120px;
}

.chart-bar-wrap {
  background: #e0e0e0;
  border-radius: 4px;
  height: 22px;
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
  border-radius: 4px;
  min-width: 4px;
  transition: width 0.4s ease;
}

.chart-value {
  text-align: right;
}
</style>
