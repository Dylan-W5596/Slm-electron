import {
    LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#007bff', '#27ae60', '#e67e22', '#9b59b6', '#f1c40f', '#e74c3c'];

/**
 * InteractiveChart - A dynamic wrapper for Recharts
 * @param {Object} config - The chart configuration JSON
 */
const InteractiveChart = ({ config }) => {
    // If config is null or doesn't have data, try to look one level deeper
    const root = (config?.data) ? config : (config?.chart || config?.config || config);
    const data = root?.data || root?.datasets || [];

    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="chart-error" style={{ color: '#888', textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
                <div>無效或空的圖表數據</div>
            </div>
        );
    }

    const { chartType = 'line', series = [], xAxis, title } = root;

    const renderChart = () => {
        switch (chartType.toLowerCase()) {
            case 'bar':
                return (
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                        <XAxis dataKey={xAxis} stroke="#888" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#888" fontSize={12} tickMargin={10} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        {series.map((s, i) => (
                            <Bar
                                key={s.key}
                                dataKey={s.key}
                                name={s.label || s.key}
                                fill={s.color || COLORS[i % COLORS.length]}
                                radius={[4, 4, 0, 0]}
                                animationDuration={1000}
                            />
                        ))}
                    </BarChart>
                );

            case 'area':
                return (
                    <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <defs>
                            {series.map((s, i) => (
                                <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color || COLORS[i % COLORS.length]} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={s.color || COLORS[i % COLORS.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                        <XAxis dataKey={xAxis} stroke="#888" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#888" fontSize={12} tickMargin={10} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '8px' }}
                        />
                        <Legend />
                        {series.map((s, i) => (
                            <Area
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label || s.key}
                                stroke={s.color || COLORS[i % COLORS.length]}
                                fillOpacity={1}
                                fill={`url(#grad-${s.key})`}
                                animationDuration={1000}
                            />
                        ))}
                    </AreaChart>
                );

            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey={series[0]?.key || 'value'}
                            nameKey={xAxis}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '8px' }}
                        />
                        <Legend />
                    </PieChart>
                );

            case 'line':
            default:
                return (
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.5} />
                        <XAxis dataKey={xAxis} stroke="#888" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#888" fontSize={12} tickMargin={10} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#2d2d2d', border: '1px solid #444', borderRadius: '8px' }}
                        />
                        <Legend />
                        {series.map((s, i) => (
                            <Line
                                key={s.key}
                                type="monotone"
                                dataKey={s.key}
                                name={s.label || s.key}
                                stroke={s.color || COLORS[i % COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                                animationDuration={1500}
                            />
                        ))}
                    </LineChart>
                );
        }
    };

    return (
        <div
            className="interactive-chart-container"
            style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
            }}>

            {title && <h3
                style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    color: '#fff'
                }}>{title}
            </h3>}

            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default InteractiveChart;
