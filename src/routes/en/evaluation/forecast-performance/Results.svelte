<script lang="ts">
	import HighchartsContainer from '$lib/components/highcharts/highcharts-container.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	let { data } = $props();

	let skill_scores = $state(['correlation']);

	let highcharts = $derived.by(() => {
		const scores = data.scores;
		const params = data.params;
		const series = [];
        // const markerSymbols = ['circle', 'square','diamond', 'triangle'];

		// Y AXIS
		let yAxis = [];
		if (skill_scores.length == 1) {
			yAxis = [
				{
					title: {
						text: skill_scores[0] == 'correlation' ? 'Correlation' : 'Skill score (%)'
					}
					// min: 0,
					// max: 100
				}
			];
		} else if (skill_scores.includes('correlation')) {
			yAxis = [
				{
					title: {
						text: 'Skill score (%)'
					}
					// min: 0,
					// max: 100
				},
				{
					title: {
						text: 'Correlation'
					},
					// min: 0,
					max: 1,
					opposite: true
				}
			];
		} else {
			yAxis = [
				{
					title: {
						text: 'Skill score (%)'
					}
					// min: 0,
					// max: 100
				}
			];
		}

		// SERIES
		for (const [s, skill_score] of skill_scores.entries()) {
			const matchingKeys = Object.keys(scores).filter((key) => key.startsWith(skill_score));
            let yAxisNumber = skill_scores.length == 1 ? 0 : skill_score == 'correlation' ? 1 : 0;
            let markerSymbol = 'triangle'
			for (const [n, name] of matchingKeys.entries()) {
				series.push({
                    type: 'line',
					name: name,
					data: scores[name],
					yAxis: yAxisNumber,
					tooltip: {
						valueDecimals: skill_score == 'correlation' ? 2 : 1,
						valueSuffix: skill_score == 'correlation' ? '' : '%'
					},
                    colorIndex: n,
                    className: skill_score,
                    marker: {symbol: markerSymbol},
				});
			}
		}
		return {
			title: {
				text: `Forecast performance at ${params.latitude}°N ${params.longitude}°E`
			},

			subtitle: {
				text:
					`Models performance comparison at different lead times from ${params.start_date} to ${params.end_date}. Reference: ${params.reference}.`
			},

			yAxis: yAxis,

			xAxis: {
				title: {
					text: 'Previous days'
				},
				accessibility: {
					rangeDescription: 'Previous days'
				}
			},

			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'middle'
			},

			plotOptions: {
				series: {
					pointStart: 1
				}
			},

			tooltip: {
				shared: true
			},

			series: series,
			responsive: {
				rules: [
					{
						condition: {
							maxWidth: 500
						},
						chartOptions: {
							legend: {
								layout: 'horizontal',
								align: 'center',
								verticalAlign: 'bottom'
							}
						}
					}
				]
			}
		};
	});

	let skillScores = [
		{ value: 'rmbe', label: 'rMBE (%)' },
		{ value: 'rmae', label: 'rMAE (%)' },
		{ value: 'rrmse', label: 'rRMSE (%)' },
		{ value: 'correlation', label: 'Correlation' }
	];

	//$inspect(highcharts)
</script>

<!-- SKILL SCORES -->
<div class="mt-6 md:mt-12">
	<h2 id="skill-scores" class="text-2xl md:text-3xl">Skill scores</h2>
	<div
		class="mt-2 grid grid-flow-row gap-x-2 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
	>
		{#each skillScores as e}
			<div class="group flex items-center" title={e.label}>
				<Checkbox
					id="{e.value}_skill"
					class="bg-muted/50 border-border-dark cursor-pointer duration-100 group-hover:border-[currentColor]"
					value={e.value}
					checked={skill_scores?.includes(e.value)}
					aria-labelledby="{e.value}_label"
					onCheckedChange={() => {
						if (skill_scores?.includes(e.value)) {
							skill_scores = skill_scores.filter((item) => {
								return item !== e.value;
							});
						} else {
							skill_scores.push(e.value);
							skill_scores = skill_scores;
						}
					}}
				/>
				<Label
					id="{e.value}_skill_label"
					for="{e.value}_skill"
					class="ml-[0.42rem] cursor-pointer truncate py-[0.1rem]">{e.label}</Label
				>
			</div>
		{/each}
	</div>
</div>
<br />

<HighchartsContainer options={highcharts}></HighchartsContainer>
<pre>{JSON.stringify(data, null, 2)}</pre>
<pre>{JSON.stringify(highcharts, null, 2)}</pre>
