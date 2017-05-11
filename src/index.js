'use strict';

// FIXME: Make labels appear under tooltip

Chart.pluginService.register({
    afterDraw(chartInstance, tick) {
        // DEV: wait for animation to complete
        // if (tick !== 1) {
        //     return;
        // }

        if (!chartInstance.options.barLabels) {
            return;
        }

        const ctx = chartInstance.chart.ctx;
        const globalOpts = chartInstance.config.options;
        const options = {
            fontSize: globalOpts.barLabels.fontSize || globalOpts.defaultFontSize,
            fontColor: globalOpts.barLabels.fontColor || '#fff',
            fontStyle: globalOpts.barLabels.fontStyle || globalOpts.defaultFontStyle,
            fontFamily: globalOpts.barLabels.fontFamily || globalOpts.defaultFontFamily,
        };

        options.format = ( typeof globalOpts.barLabels.format === 'function'
            ? globalOpts.barLabels.format
            : (value) => value );

        options.hideNotFitting = globalOpts.barLabels.hasOwnProperty('hideNotFitting')
            ? globalOpts.barLabels.hideNotFitting
            : true;

        ctx.save();

        chartInstance.data.datasets.forEach((dataset, datasetIndex) => {
            const dsMeta = chartInstance.getDatasetMeta(datasetIndex);

            const dsOptions = chartInstance.config.data.datasets[datasetIndex].barLabels || {};

            dsMeta.data.forEach((rectangle, index) => {
                const labelContent = options.format(dataset.data[index]);
                const labelBounds = {
                    width: ctx.measureText(labelContent).width,
                    height: options.fontSize,
                };

                const barCenter = rectangle.getCenterPoint();
                const barBounds = getBarBounds(rectangle);

                const labelFits = (labelBounds.width < barBounds.width)
                    && (labelBounds.height < barBounds.height);

                const labelPosition = {
                    x: barCenter.x - ctx.measureText(labelContent).width/2,
                    y: barCenter.y - options.fontSize/2
                };
                if (options.hideNotFitting && !labelFits) {
                    return;
                }

                // console.log(dataset);

                ctx.font = Chart.helpers.fontString(
                    dsOptions.fontSize || options.fontSize,
                    dsOptions.fontStyle || options.fontStyle,
                    dsOptions.fontFamily || options.fontFamily
                );
                ctx.fillStyle = dsOptions.fontColor || options.fontColor;
                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';
                ctx.fillText(labelContent, labelPosition.x, labelPosition.y);
            });
        });

        ctx.restore();
    }
});

Chart.pluginService.register({
    afterDraw(chartInstance, tick) {
        // DEV: wait for animation to complete
        // if (tick !== 1) {
        //     return;
        // }

        if (!chartInstance.options.stackLabels) {
            return;
        }

        const ctx = chartInstance.chart.ctx;
        const globalOpts = chartInstance.config.options;
        const options = {
            fontSize: globalOpts.stackLabels.fontSize || globalOpts.defaultFontSize,
            fontColor: globalOpts.stackLabels.fontColor || '#222',
            fontStyle: globalOpts.stackLabels.fontStyle || globalOpts.defaultFontStyle,
            fontFamily: globalOpts.stackLabels.fontFamily || globalOpts.defaultFontFamily,
        };

        options.format = ( typeof globalOpts.stackLabels.format === 'function'
            ? globalOpts.stackLabels.format
            : (value) => value );


        const totals = [];
        const barBounds = [];
        chartInstance.data.datasets.forEach((dataset, datasetIndex) => {
            dataset.data.forEach((value, i) => {
                if (!totals.hasOwnProperty(i)) {
                    totals[i] = 0;
                }
                totals[i] += value;
            });

            const dsMeta = chartInstance.getDatasetMeta(datasetIndex);
            dsMeta.data.forEach((rectangle, i) => {
                const elBounds = getBarBounds(rectangle);

                if (!barBounds.hasOwnProperty(i)) {
                    barBounds[i] = elBounds;
                } else {
                    barBounds[i].top = Math.min(barBounds[i].top, elBounds.top);
                    barBounds[i].bottom = Math.max(barBounds[i].bottom, elBounds.bottom);
                    barBounds[i].left = Math.min(barBounds[i].left, elBounds.left);
                    barBounds[i].right = Math.max(barBounds[i].right, elBounds.right);
                }
            })
        });

        ctx.save();
        totals.forEach((value, index) => {
            const labelContent = options.format(value);

            const labelPosition = {
                x: (barBounds[index].left + barBounds[index].right) / 2,
                y: barBounds[index].top
            };

            ctx.font = Chart.helpers.fontString(
                options.fontSize,
                options.fontStyle,
                options.fontFamily
            );
            ctx.fillStyle = options.fontColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            ctx.fillText(labelContent, labelPosition.x, labelPosition.y)
        });
        ctx.restore();
    }
});

/**
 *
 *  @param {Chart.Element.Rectangle} bar
 *  @return {{
 *      left: Number,
 *      top: Number,
 *      right: Number,
 *      bottom: Number,
 *      width: Number,
 *      height: Number
 *  }}
 */
function getBarBounds(bar) {
    const vm = bar._view;
    let x1, x2, y1, y2;

    function isVertical(bar) { return bar._view.width !== undefined; }

    if (isVertical(bar)) {
        // vertical
        const halfWidth = vm.width / 2;
        x1 = vm.x - halfWidth;
        x2 = vm.x + halfWidth;
        y1 = Math.min(vm.y, vm.base);
        y2 = Math.max(vm.y, vm.base);
    } else {
        // horizontal bar
        const halfHeight = vm.height / 2;
        x1 = Math.min(vm.x, vm.base);
        x2 = Math.max(vm.x, vm.base);
        y1 = vm.y - halfHeight;
        y2 = vm.y + halfHeight;
    }

    return {
        left: x1,
        top: y1,
        right: x2,
        bottom: y2,
        width: x2 - x1,
        height: y2 - y1,
    };
}