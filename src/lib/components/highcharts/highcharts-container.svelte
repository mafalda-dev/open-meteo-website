<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { dev } from '$app/environment';

	import { mode } from 'mode-watcher';

	import './highcharts.css';

	let {
		options,
		useStockChart = false,
		style = 'height: 400px',
		class: clazz = 'w-full'
	} = $props();

	let node: HTMLElement;
	let chart: any;

	onMount(async () => {
		/// Highcharts needs to be loaded in `onMount` to work with prerendered SSG
		const Highcharts = (await import('./highcharts-custom')).default;

		if (dev) {
			// const HighchartsDebugger = await import('highcharts/modules/debugger');
			// HighchartsDebugger.default(Highcharts);
			const Debugger = (await import('highcharts/es-modules/Extensions/Debugger/Debugger.js'))
				.default;
			const ErrorMessages = (
				await import('highcharts/es-modules/Extensions/Debugger/ErrorMessages.js')
			).default;
			Highcharts.errorMessages = ErrorMessages;
			Debugger.compose(Highcharts.Chart);
		}
		//HighchartsAccessibility(Highcharts);
		let options2 = {...options}
		options2.chart = options.chart || {};
		options2.chart.styledMode = true;
		options2.lang = {
			locale: 'en-GB'
		};
		options2.accessibility = {
			enabled: false
		};
		options2.credits = {
			text: 'Open-Meteo.com',
			href: 'http://open-meteo.com'
		};
		if (useStockChart) {
			// const HighchartsStock = await import('highcharts/modules/stock');
			// HighchartsStock.default(Highcharts);
			// chart = new Highcharts.StockChart(node, options);
			chart = new Highcharts.StockChart(node, options2);
		} else {
			chart = new Highcharts.Chart(node, options2);
		}
	});

	$effect(() => {
		// Note: `options` must be accessed to enable state tracking
		let option2 = options;
		if (!chart) {
			return;
		}
		chart.update(option2, true, true);
	});

	onDestroy(() => {
		if (chart) {
			chart.destroy();
		}
	});
</script>

<div
	bind:this={node}
	{style}
	class={clazz}
	class:highcharts-dark={mode.current === 'dark'}
	class:highcharts-light={mode.current !== 'dark'}
></div>
