<script lang="ts">
	import HighchartsContainer from '$lib/components/highcharts/highcharts-container.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { models, referenceDatasets } from './options';

	let { data } = $props();

	let skill_scores = $state(['correlation']);

	const scores = data.scores;
	const params = data.params;

	let highcharts = $derived.by(() => {
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
			let markerSymbol = 'triangle';
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
					marker: { symbol: markerSymbol }
				});
			}
		}
		return {
			title: {
				text: `Forecast performance at ${params.latitude}°N ${params.longitude}°E`
			},

			subtitle: {
				text: `Models performance comparison at different lead times from ${params.start_date} to ${params.end_date}. Reference: ${params.reference}.`
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

	const skillLabels = Object.fromEntries(skillScores.map(({ value, label }) => [value, label]));
	const referenceLabels = Object.fromEntries(
		referenceDatasets[0].map(({ value, table_label }) => [value, table_label])
	);
	const modelLabels = Object.fromEntries(models.flat().map(({ value, label }) => [value, label]));

	type Table = {
		[rowIndex: number]: {
			[model: string]: number | null;
		};
	};

	const scoresTables: Record<string, Table> = {};

	for (const { value: skill } of skillScores) {
		const table: Table = {};

		// Initialize rows 1 to 7
		for (let i = 0; i < 7; i++) {
			table[i + 1] = {}; // rows will be 1-indexed
		}
		for (const key in scores) {
			if (key.startsWith(skill)) {
				const model = key.replace(`${skill}_`, '');
				const values = scores[key];
				values.forEach((value, index) => {
					table[index + 1][model] = value ?? null;
				});
			}
		}
		scoresTables[skill] = table;
	}

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
<!-- <pre>{JSON.stringify(data, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(highcharts, null, 2)}</pre> -->
<!-- <pre>{JSON.stringify(tables, null, 2)}</pre> -->

<!-- SCORES TABLE -->
<div class="mt-6 w-full md:mt-12">
	<h2 id="scores_table" class="text-2xl md:text-3xl">Scores Summary</h2>
	<div class="mt-2 md:mt-4">
		<p>The scores for each model at different lead times are summarized in the table below.</p>
		<p>
			Scores are calculated respect to the selected <mark>Reference data</mark>, in this case
			<mark>{referenceLabels[params.reference]}</mark>. A different reference can be selected.
			Satellite data is only available for radiation variables and the dataset is selected
			automatically based on the data avilability in the region and time period selected.
		</p>
		<p>
			Weather models cover different geographic areas at different resolutions and provide different
			weather variables. From the menu <mark>Weather models</mark> you can select and compare different
			weather models.
		</p>
		{#each Object.entries(scoresTables) as [skill, table]}
			<div class="mb-6">
				<h2 class="text-lg font-bold mb-2">{skillLabels[skill]}</h2>
				<table class="table-auto border-collapse border border-gray-300 w-full text-sm">
					<!-- <table class="[&_tr]:border-border mx-6 md:ml-0 lg:mx-0 mt-2 min-w-[1040px] w-full caption-bottom text-left md:mt-4 [&_td]:px-1 [&_td]:py-2 [&_th]:py-2 [&_th]:pr-2 [&_tr]:border-b"> -->
					<thead>
						<tr>
							<th class="border border-gray-300 p-2">Lead days</th>
							{#each Object.keys(table[1]) as model}
								<th class="border border-gray-300 p-2">{modelLabels[model]}</th>
							{/each}
						</tr>
					</thead>
					<tbody class="[&_a]:text-link [&_a]:underline-offset-3 [&_a]:underline">
						{#each Object.entries(table) as [rowIndex, row]}
							<tr>
								<td class="border border-gray-300 p-2">{rowIndex}</td>
								{#each Object.values(row) as value}
									<td class="border border-gray-300 p-2 text-center">
										{value === null || isNaN(value)
											? '--'
											: value.toFixed(skill === 'correlation' ? 2 : 1)}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	</div>
</div>
