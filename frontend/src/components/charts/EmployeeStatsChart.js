import React from 'react';
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import Chart from 'react-apexcharts';

const EmployeeStatsChart = ({ data }) => {
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const gridBorderColor = useColorModeValue('#E2E8F0', '#2D3748');
  
  if (!data) {
    return (
      <Box p={4} textAlign="center">
        <Text color={textColor}>Aucune donnée disponible</Text>
      </Box>
    );
  }

  const chartData = {
    series: [
      {
        name: 'Employés',
        data: [data.actifs, data.inactifs, data.nouveauxCeMois],
      },
    ],
    options: {
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: ['Actifs', 'Inactifs', 'Nouveaux ce mois'],
        labels: {
          style: {
            colors: textColor,
          },
        },
      },
      yaxis: {
        title: {
          text: 'Nombre d\'employés',
          style: {
            color: textColor,
          },
        },
        labels: {
          style: {
            colors: textColor,
          },
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (val) => val + ' employés',
        },
      },
      colors: ['#4318FF', '#6AD2FF', '#05CD99'],
      grid: {
        borderColor: gridBorderColor,
      },
    },
  };

  return (
    <Box>
      <Text fontSize="lg" fontWeight="600" color={textColor} mb={4}>
        Statistiques des employés
      </Text>
      <Chart options={chartData.options} series={chartData.series} type="bar" height={350} />
    </Box>
  );
};

export default EmployeeStatsChart;
