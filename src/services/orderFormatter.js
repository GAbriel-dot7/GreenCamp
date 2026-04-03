(function () {
  function formatCurrency(value) {
    return 'R$' + Number(value || 0).toFixed(2).replace('.', ',');
  }

  function getAppConfig() {
    return window.GREENCAMP_APP_CONFIG || {
      restaurantName: 'Green Camp Restaurante',
      whatsappNumber: '5519995992614',
      orderStatuses: ['novo', 'em_preparo', 'saiu', 'concluido'],
      currency: 'BRL',
    };
  }

  function buildWhatsAppMessage(order) {
    const config = getAppConfig();
    const lines = [];

    lines.push(`🐟 *PEDIDO – ${config.restaurantName}*`);
    lines.push('');
    lines.push(`📦 *Tipo:* ${order.orderType === 'retirada' ? 'Retirada' : 'Entrega'}`);
    if (order.customerName) lines.push(`🙍 *Cliente:* ${order.customerName}`);
    if (order.customerPhone) lines.push(`📞 *Contato:* ${order.customerPhone}`);
    lines.push('');
    lines.push('*Itens:*');

    order.items.forEach((item) => {
      const detailText = item.details && item.details.length ? ` (${item.details.join(', ')})` : '';
      lines.push(`▸ ${item.qty}x ${item.product.name}${detailText} – ${formatCurrency(item.unitPrice * item.qty)}`);
    });

    lines.push('');
    lines.push(`💰 *Total: ${formatCurrency(order.total)}*`);

    if (order.notes) {
      lines.push('');
      lines.push(`📝 *Obs:* ${order.notes}`);
    }

    return lines.join('\n');
  }

  function buildThermalTicket(order) {
    const config = getAppConfig();
    const separator = '-'.repeat(32);
    const lines = [];

    lines.push(config.restaurantName.toUpperCase());
    lines.push(`Pedido #${order.id || 'novo'}`);
    lines.push(new Date(order.createdAt || Date.now()).toLocaleString('pt-BR'));
    lines.push(separator);
    lines.push(`Tipo: ${order.orderType === 'retirada' ? 'Retirada' : 'Entrega'}`);
    if (order.customerName) lines.push(`Cliente: ${order.customerName}`);
    if (order.customerPhone) lines.push(`Contato: ${order.customerPhone}`);
    lines.push(separator);

    order.items.forEach((item) => {
      lines.push(`${item.qty}x ${item.product.name}`);
      if (item.details && item.details.length) {
        lines.push(`  ${item.details.join(' / ')}`);
      }
      lines.push(`  ${formatCurrency(item.unitPrice * item.qty)}`);
    });

    lines.push(separator);
    lines.push(`TOTAL: ${formatCurrency(order.total)}`);

    if (order.notes) {
      lines.push(separator);
      lines.push(`OBS: ${order.notes}`);
    }

    lines.push(separator);
    lines.push('GERADO PELO CARDAPIO DIGITAL');

    return lines.join('\n');
  }

  window.GreenCampOrderFormatter = {
    formatCurrency,
    buildWhatsAppMessage,
    buildThermalTicket,
  };
})();
