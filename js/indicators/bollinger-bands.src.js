'use strict';

import H from '../parts/Globals.js';
import '../parts/Utilities.js';
import multipleLinesMixin from '../mixins/multipe-lines.js';

var merge = H.merge,
    isArray = H.isArray,
    SMA = H.seriesTypes.sma;

// Utils:
function getStandardDeviation(arr, index, isOHLC, mean) {
    var variance = 0,
        arrLen = arr.length,
        std = 0,
        i = 0,
        value;

    for (; i < arrLen; i++) {
        value = (isOHLC ? arr[i][index] : arr[i]) - mean;
        variance += value * value;
    }
    variance = variance / (arrLen - 1);

    std = Math.sqrt(variance);
    return std;
}

H.seriesType('bb', 'sma',
    /**
     * Bollinger bands (BB). This series requires the `linkedTo` option to be
     * set and should be loaded after the `stock/indicators/indicators.js` file.
     *
     * @extends plotOptions.sma
     * @product highstock
     * @sample {highstock} stock/indicators/bollinger-bands
     *                     Bollinger bands
     * @since 6.0.0
     * @optionparent plotOptions.bb
     */
    {
        params: {
            period: 20,
            /**
             * Standard deviation for top and bottom bands.
             *
             * @type {Number}
             * @since 6.0.0
             * @product highstock
             */
            standardDeviation: 2,
            index: 3
        },
        /**
         * Bottom line options.
         *
         * @since 6.0.0
         * @product highstock
         */
        bottomLine: {
            /**
             * Styles for a bottom line.
             *
             * @since 6.0.0
             * @product highstock
             */
            styles: {
                /**
                 * Pixel width of the line.
                 *
                 * @type {Number}
                 * @since 6.0.0
                 * @product highstock
                 */
                lineWidth: 1,
                /**
                 * Color of the line. If not set, it's inherited from
                 * [plotOptions.bb.color](#plotOptions.bb.color).
                 *
                 * @type {String}
                 * @since 6.0.0
                 * @product highstock
                 */
                lineColor: undefined
            }
        },
        /**
         * Top line options.
         *
         * @extends plotOptions.bb.bottomLine
         * @since 6.0.0
         * @product highstock
         */
        topLine: {
            styles: {
                lineWidth: 1,
                lineColor: undefined
            }
        },
        tooltip: {
            pointFormat: '<span style="color:{point.color}">\u25CF</span><b> {series.name}</b><br/>Top: {point.top}<br/>Middle: {point.middle}<br/>Bottom: {point.bottom}<br/>'
        },
        marker: {
            enabled: false
        },
        dataGrouping: {
            approximation: 'averages'
        }
    }, /** @lends Highcharts.Series.prototype */ H.merge(multipleLinesMixin, {
        pointArrayMap: ['top', 'middle', 'bottom'],
        pointValKey: 'middle',
        nameComponents: ['period', 'standardDeviation'],
        linesApiNames: ['topLine', 'bottomLine'],
        init: function () {
            SMA.prototype.init.apply(this, arguments);

            // Set default color for lines:
            this.options = merge({
                topLine: {
                    styles: {
                        lineColor: this.color
                    }
                },
                bottomLine: {
                    styles: {
                        lineColor: this.color
                    }
                }
            }, this.options);
        },
        getValues: function (series, params) {
            var period = params.period,
                standardDeviation = params.standardDeviation,
                xVal = series.xData,
                yVal = series.yData,
                yValLen = yVal ? yVal.length : 0,
                BB = [], // 0- date, 1-middle line, 2-top line, 3-bottom line
                ML, TL, BL, // middle line, top line and bottom line
                date,
                xData = [],
                yData = [],
                slicedX,
                slicedY,
                stdDev,
                isOHLC,
                point,
                i;

            if (xVal.length < period) {
                return false;
            }

            isOHLC = isArray(yVal[0]);

            for (i = period; i <= yValLen; i++) {
                slicedX = xVal.slice(i - period, i);
                slicedY = yVal.slice(i - period, i);

                point = SMA.prototype.getValues.call(
                    this,
                    {
                        xData: slicedX,
                        yData: slicedY
                    },
                    params
                );

                date = point.xData[0];
                ML = point.yData[0];
                stdDev = getStandardDeviation(
                    slicedY,
                    params.index,
                    isOHLC,
                    ML
                );
                TL = ML + standardDeviation * stdDev;
                BL = ML - standardDeviation * stdDev;

                BB.push([date, TL, ML, BL]);
                xData.push(date);
                yData.push([TL, ML, BL]);
            }

            return {
                values: BB,
                xData: xData,
                yData: yData
            };
        }
    })
);

/**
 * A bollinger bands indicator. If the [type](#series.bb.type) option is not
 * specified, it is inherited from [chart.type](#chart.type).
 *
 * @type {Object}
 * @since 6.0.0
 * @extends series,plotOptions.bb
 * @excluding data,dataParser,dataURL
 * @product highstock
 * @apioption series.bb
 */

/**
 * An array of data points for the series. For the `bb` series type,
 * points are calculated dynamically.
 *
 * @type {Array<Object|Array>}
 * @since 6.0.0
 * @extends series.line.data
 * @product highstock
 * @apioption series.bb.data
 */
