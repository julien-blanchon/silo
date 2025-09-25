<script lang="ts">
  import { cn } from '$lib/utils';

  let {
    location,
    temperature,
    condition,
    humidity,
    unit = 'fahrenheit'
  }: {
    location: string;
    temperature: number;
    condition: string;
    humidity: number;
    unit?: string;
  } = $props();

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return '☀️';
    } else if (lowerCondition.includes('cloudy') || lowerCondition.includes('overcast')) {
      return '☁️';
    } else if (lowerCondition.includes('partly')) {
      return '⛅';
    } else if (lowerCondition.includes('rain')) {
      return '🌧️';
    } else if (lowerCondition.includes('snow')) {
      return '❄️';
    } else if (lowerCondition.includes('storm')) {
      return '⛈️';
    }
    return '🌤️';
  };

  const getBackgroundGradient = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return 'from-blue-400 to-blue-600';
    } else if (lowerCondition.includes('cloudy')) {
      return 'from-gray-400 to-gray-600';
    } else if (lowerCondition.includes('rain')) {
      return 'from-gray-500 to-blue-700';
    } else if (lowerCondition.includes('snow')) {
      return 'from-gray-300 to-blue-400';
    }
    return 'from-blue-400 to-blue-600';
  };

  const unitSymbol = unit === 'celsius' ? '°C' : '°F';
</script>

<div class={cn(
  'flex flex-col gap-4 rounded-xl p-4 text-white shadow-lg max-w-sm bg-gradient-to-br',
  getBackgroundGradient(condition)
)}>
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold">{location}</h3>
      <p class="text-sm text-white/80 capitalize">{condition}</p>
    </div>
    <div class="text-3xl">
      {getWeatherIcon(condition)}
    </div>
  </div>
  
  <div class="flex items-center justify-between">
    <div class="flex items-baseline gap-1">
      <span class="text-4xl font-bold">{Math.round(temperature)}</span>
      <span class="text-lg text-white/80">{unitSymbol}</span>
    </div>
    <div class="text-right">
      <div class="text-sm text-white/80">Humidity</div>
      <div class="text-lg font-medium">{humidity}%</div>
    </div>
  </div>
</div>
