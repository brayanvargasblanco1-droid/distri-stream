/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * COMPONENTES REUTILIZABLES
 * UI components para la aplicación
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const Components = {
  // Badge de estado
  statusBadge(status, options = {}) {
    const config = {
      'Abierto': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: '📋' },
      'En revisión': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '🔍' },
      'En proceso': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '⚙️' },
      'Resuelto': { color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
      'Rechazado': { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '❌' }
    };

    const { color, bg, icon } = config[status] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '●' };

    return `
      <span style="
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: ${options.compact ? '2px 8px' : '4px 12px'};
        border-radius: 20px;
        font-size: ${options.compact ? '10px' : '12px'};
        font-weight: 700;
        color: ${color};
        background: ${bg};
      ">
        ${icon} ${status}
      </span>
    `;
  },

  // Tarjeta simple
  card(content, options = {}) {
    return `
      <div style="
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: ${options.radius || 12}px;
        padding: ${options.padding || 16}px;
        ${options.shadow ? 'box-shadow: 0 4px 20px rgba(0,0,0,0.1);' : ''}
      ">
        ${content}
      </div>
    `;
  },

  // Botón
  button(text, onClick, options = {}) {
    const variants = {
      primary: 'background: linear-gradient(135deg, var(--blue), #0057dc); color: #fff;',
      secondary: 'background: var(--panel); color: var(--text); border: 1px solid var(--line);',
      danger: 'background: rgba(239,68,68,0.1); color: #ef4444;',
      success: 'background: rgba(16,185,129,0.1); color: #10b981;',
      ghost: 'background: transparent; color: var(--text); border: 1px solid var(--line);'
    };

    const style = variants[options.variant || 'primary'];

    return `
      <button 
        onclick="${onClick}"
        style="
          ${style}
          padding: ${options.compact ? '8px 12px' : '12px 20px'};
          border-radius: ${options.radius || 10}px;
          font-size: ${options.compact ? '12px' : '14px'};
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          ${options.fullWidth ? 'width: 100%; justify-content: center;' : ''}
        "
        ${options.disabled ? 'disabled' : ''}
      >
        ${options.icon || ''} ${text}
      </button>
    `;
  },

  // Input
  input(options = {}) {
    return `
      <input 
        type="${options.type || 'text'}"
        placeholder="${options.placeholder || ''}"
        value="${options.value || ''}"
        id="${options.id || ''}"
        style="
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid var(--line);
          border-radius: 10px;
          font-size: 14px;
          background: var(--soft);
          color: var(--text);
          transition: border-color 0.2s;
          box-sizing: border-box;
        "
        ${options.required ? 'required' : ''}
        ${options.disabled ? 'disabled' : ''}
      >
    `;
  },

  // Loading spinner
  spinner(size = 24) {
    return `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border: 3px solid var(--line);
        border-top-color: var(--blue);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
    `;
  },

  // Skeleton loader
  skeleton(width = '100%', height = 20) {
    return `
      <div style="
        width: ${width};
        height: ${height}px;
        background: linear-gradient(90deg, var(--soft) 25%, var(--panel) 50%, var(--soft) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 6px;
      "></div>
    `;
  },

  // Empty state
  emptyState(icon, title, message, action = '') {
    return `
      <div style="text-align: center; padding: 50px 20px;">
        <div style="font-size: 56px; margin-bottom: 16px; opacity: 0.5;">${icon}</div>
        <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">${title}</div>
        <div style="font-size: 13px; color: var(--muted); margin-bottom: 20px;">${message}</div>
        ${action}
      </div>
    `;
  },

  // Toast notification (inline)
  toast(message, type = 'info') {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    const color = colors[type] || colors.info;

    return `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: var(--panel);
        border: 1px solid ${color};
        border-left: 4px solid ${color};
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
      ">
        ${message}
      </div>
    `;
  },

  // Modal header
  modalHeader(title, subtitle = '') {
    return `
      <div style="
        padding: 20px 24px;
        border-bottom: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        align-items: start;
      ">
        <div>
          <h2 style="margin: 0; font-size: 18px; font-weight: 800;">${title}</h2>
          ${subtitle ? `<p style="margin: 4px 0 0; font-size: 12px; color: var(--muted);">${subtitle}</p>` : ''}
        </div>
        <button onclick="closeModal()" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--muted);
          padding: 0;
          line-height: 1;
        ">&times;</button>
      </div>
    `;
  },

  // Progress bar
  progressBar(value, max = 100, color = 'var(--blue)') {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return `
      <div style="
        width: 100%;
        height: 8px;
        background: var(--soft);
        border-radius: 4px;
        overflow: hidden;
      ">
        <div style="
          width: ${percentage}%;
          height: 100%;
          background: ${color};
          border-radius: 4px;
          transition: width 0.3s ease;
        "></div>
      </div>
    `;
  },

  // Stats card
  statsCard(value, label, icon, color = 'var(--blue)') {
    return `
      <div style="
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 16px;
        text-align: center;
      ">
        <div style="font-size: 28px; margin-bottom: 8px;">${icon}</div>
        <div style="font-size: 24px; font-weight: 900; color: ${color};">${value}</div>
        <div style="font-size: 11px; color: var(--muted);">${label}</div>
      </div>
    `;
  }
};

// Exportar
window.Components = Components;
