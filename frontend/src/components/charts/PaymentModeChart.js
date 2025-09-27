import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import Chart from 'react-apexcharts';

const PaymentModeChart = ({ data }) => {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  
  if (!data || data.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text color={textColor}>Aucune donnée disponible</Text>
      </Box>
    );
  }

  const chartData = {
    series: data.map(item => item.montantTotal),
    options: {
      chart: {
        type: 'donut',
        height: 350,
      },
      labels: data.map(item => item.mode),
      colors: ['#4318FF', '#6AD2FF', '#EFF4FB', '#FFB547', '#05CD99'],
      legend: {
        position: 'bottom',
        labels: {
          colors: textColor,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val, opts) => {
          const value = opts.w.config.series[opts.seriesIndex];
          return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
          },
        },
      },
      tooltip: {
        y: {
          formatter: (val) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA',
        },
      },
    },
  };

  return (
    <Box>
      <Text fontSize="lg" fontWeight="600" color={textColor} mb={4}>
        Répartition des paiements par mode
      </Text>
      <Chart options={chartData.options} series={chartData.series} type="donut" height={350} />
    </Box>
  );
};

export default PaymentModeChart;
