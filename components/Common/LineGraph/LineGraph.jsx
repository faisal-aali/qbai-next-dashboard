"use client";
import dynamic from 'next/dynamic';
import 'chart.js/auto';
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
    ssr: false,
});

const LineGraph = ({ data, options }) => {
    return (
        <Line data={data} options={options} />
    );
};
export default LineGraph;