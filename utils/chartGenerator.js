const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const chartGenerator = new ChartJSNodeCanvas({
    width: 800,
    height: 400,
    backgroundColour: '#2F3136' // Discord-like dark theme
});

async function generateUnitsChart(data) {
    const config = {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Units',
                data: data.units,
                borderColor: '#5865F2', // Discord blue
                backgroundColor: 'rgba(88, 101, 242, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#FFFFFF'
                    }
                },
                title: {
                    display: true,
                    text: 'Units Over Time',
                    color: '#FFFFFF',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#FFFFFF'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#FFFFFF'
                    }
                }
            }
        }
    };

    return await chartGenerator.renderToBuffer(config);
}

module.exports = { generateUnitsChart }; 