const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const chartGenerator = new ChartJSNodeCanvas({
    width: 800,
    height: 400,
    backgroundColour: '#ffffff'
});

async function generateWinRateChart(data) {
    const config = {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Win Rate %',
                data: data.winRates,
                fill: false,
                borderColor: '#00ff00',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Win Rate Over Time'
                }
            }
        }
    };

    return await chartGenerator.renderToBuffer(config);
}

async function generateProfitChart(data) {
    const config = {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Profit/Loss ($)',
                data: data.profits,
                fill: true,
                borderColor: '#0000ff',
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Profit/Loss Over Time'
                }
            }
        }
    };

    return await chartGenerator.renderToBuffer(config);
}

module.exports = { generateWinRateChart, generateProfitChart }; 