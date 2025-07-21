import { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  datasets: any[];
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  change?: number;
}

export function StatsCard({ title, value, icon, color, change }: StatsCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white">
            {value.toLocaleString()}
          </p>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className = '' }: ChartCardProps) {
  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/10 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="h-64">
        {children}
      </div>
    </div>
  );
}

export function LineChart({ data }: { data: ChartData }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}

export function DoughnutChart({ data }: { data: ChartData }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white',
        },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}

export function BarChart({ data }: { data: ChartData }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'white',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingSpinner({ size = 'md', color = 'white' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-${color} ${sizeClasses[size]}`}
      />
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    danger: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    default: 'bg-gray-500 text-white',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  onClose?: () => void;
}

export function Alert({ children, variant = 'info', onClose }: AlertProps) {
  const variantClasses = {
    success: 'bg-green-900/50 border-green-700 text-green-200',
    warning: 'bg-yellow-900/50 border-yellow-700 text-yellow-200',
    danger: 'bg-red-900/50 border-red-700 text-red-200',
    info: 'bg-blue-900/50 border-blue-700 text-blue-200',
  };

  return (
    <div className={`border rounded-lg p-4 ${variantClasses[variant]}`}>
      <div className="flex justify-between items-start">
        <div>{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-current hover:text-white ml-4"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
