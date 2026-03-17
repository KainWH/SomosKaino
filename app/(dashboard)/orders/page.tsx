export default function OrdersPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Pedidos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gestiona tus órdenes de venta</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-orange-500">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Módulo de Pedidos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            Aquí podrás ver todos tus pedidos, cambiar estados (pendiente → enviado → entregado)
            y hacer seguimiento de cada venta.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 text-left mb-6 w-full max-w-xs mx-auto sm:max-w-none">
            {[
              { icon: "🟡", label: "Pendientes", val: "0" },
              { icon: "🔵", label: "Enviados", val: "0" },
              { icon: "🟢", label: "Entregados", val: "0" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 text-center">
                <p className="text-lg">{s.icon}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-white">{s.val}</p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          <span className="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold px-3 py-1.5 rounded-full">
            Próximamente
          </span>
        </div>
      </div>
    </div>
  )
}
