// Pantheon Chart Theme - Dark theme with green accents
export const overrides = () => ({
  // === CANDLE STYLE PROPERTIES - Pantheon Green/Red ===
  'mainSeriesProperties.candleStyle.upColor': '#61CA87',
  'mainSeriesProperties.candleStyle.downColor': '#d55355',
  'mainSeriesProperties.candleStyle.borderUpColor': '#61CA87',
  'mainSeriesProperties.candleStyle.borderDownColor': '#d55355',
  'mainSeriesProperties.candleStyle.wickUpColor': '#61CA87',
  'mainSeriesProperties.candleStyle.wickDownColor': '#d55355',
  'mainSeriesProperties.candleStyle.drawWick': true,
  'mainSeriesProperties.candleStyle.drawBorder': true,

  // === PANE BACKGROUND & GRID - Pantheon Dark ===
  'paneProperties.background': '#030712',
  'paneProperties.backgroundType': 'solid',
  'paneProperties.vertGridProperties.color': 'rgba(97, 202, 135, 0.06)',
  'paneProperties.horzGridProperties.color': 'rgba(97, 202, 135, 0.06)',
  'paneProperties.crossHairProperties.color': 'rgba(97, 202, 135, 0.3)',

  // === LEGEND ===
  'paneProperties.legendProperties.showLegend': true,
  'paneProperties.legendProperties.showStudyTitles': true,
  'paneProperties.legendProperties.showSeriesTitle': true,
  'paneProperties.legendProperties.showStudyValues': true,

  // === SCALES - Pantheon Style ===
  'scalesProperties.backgroundColor': '#030712',
  'scalesProperties.lineColor': 'rgba(97, 202, 135, 0.15)',
  'scalesProperties.textColor': '#9ca3af',
  'scalesProperties.fontSize': 11,
  'scalesProperties.showSeriesLastValue': true,
  'priceScaleProperties.showSeriesLastValue': true,

  // === SYMBOL WATERMARK ===
  'symbolWatermarkProperties.visibility': false,

  // === TIME SCALE - Pantheon Borders ===
  'timeScale.rightOffset': 5,
  'timeScale.barSpacing': 6,
  'timeScale.borderColor': 'rgba(97, 202, 135, 0.15)',
  'timeScale.visible': true,
});
