<script lang="ts">
	import HighchartsContainer from '$lib/components/highcharts/highcharts-container.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { models, referenceDatasets, hssVariables } from './options';

	let { data } = $props();

	const scores = data.scores;
	const params = data.params;

	let skill_scores = $state(['correlation']);

	let skillScores = [
		...(hssVariables.includes(params.hourly[0]) ? [{ value: 'hss', label: 'HSS' }] : []),
		{ value: 'correlation', label: 'Correlation' },
		{ value: 'rmbe', label: 'rMBE (%)' },
		{ value: 'rmae', label: 'rMAE (%)' },
		{ value: 'rrmse', label: 'rRMSE (%)' }
	];

	const skillLabels = Object.fromEntries(skillScores.map(({ value, label }) => [value, label]));
	const referenceLabels = Object.fromEntries(
		referenceDatasets.map(({ value, table_label }) => [value, table_label])
	);
	const modelLabels = Object.fromEntries(models.flat().map(({ value, label }) => [value, label]));
	const scoresPrimAxis = ['rmbe', 'rmae', 'rrmse'];
	const scoresSecAxis = ['correlation', 'hss'];
	function getLabels(subset: string[], axis: string[]): string {
		const filtered = subset.filter((value) => axis.includes(value));
		return filtered.length ? filtered.map((value) => skillLabels[value]).join(', ') : '';
	}

	// HIGHCHARTS
	let highcharts = $derived.by(() => {
		const series = [];
		// const markerSymbols = ['circle', 'square','diamond', 'triangle'];

		// Y AXIS
		let yAxis = [
			{
				id: 0,
				title: {
					text: getLabels(skill_scores, scoresPrimAxis)
				}
				// min: 0,
				// max: 100
			},
			{
				id: 1,
				title: {
					text: getLabels(skill_scores, scoresSecAxis)
				},
				// min: 0,
				max: 1,
				opposite: true
			}
		];

		// SERIES
		for (const [s, skill_score] of skill_scores.entries()) {
			const matchingKeys = Object.keys(scores).filter((key) => key.startsWith(skill_score));
			let yAxisNumber = scoresSecAxis.includes(skill_score) ? 1 : 0;
			let markerSymbol = 'triangle';
			for (const [n, name] of matchingKeys.entries()) {
				series.push({
                    id: name,
					type: 'line',
					name: name,
					data: scores[name],
					yAxis: yAxisNumber,
					tooltip: {
						valueDecimals: scoresSecAxis.includes(skill_score) ? 2 : 1,
						valueSuffix: scoresSecAxis.includes(skill_score) ? '' : '%'
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
				},
				min: params.reference == 'day0' ? 1 : 0
			},

			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'middle'
			},

			plotOptions: {
				series: {
					pointStart: 0
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

	// SCORES TABLE
	type Table = {
		[rowIndex: number]: {
			[model: string]: number | null;
		};
	};

	const scoresTables: Record<string, Table> = {};

	for (const { value: skill } of skillScores) {
		const table: Table = {};

		// Initialize rows 0 to 7 or 1 to 7 (if reference is day0)
		let start_index = params.reference == 'day0' ? 1 : 0;
		for (let i = start_index; i < 8; i++) {
			table[i] = {}; // rows will be 1-indexed
		}
		for (const key in scores) {
			if (key.startsWith(skill)) {
				const model = key.replace(`${skill}_`, '');
				const values = scores[key].slice(start_index);
				values.forEach((value, index) => {
					table[index + start_index][model] = value ?? null;
				});
			}
		}
		scoresTables[skill] = table;
	}

	// COLOR CODE FOR TABLE
	function getCellColorClass(skill: string, value: number | null): string {
		if (value === null) return '';

		const poor = `background-color: #ffff7f; color: black`;
		const good = `background-color: #74d600; color: black`; // 'bg-green-100 text-black';
		const excellent = `background-color: #028900; color: black`;

		switch (skill) {
			case 'rmbe':
				if (value == null || isNaN(value)) return '';
				if (Math.abs(value) <= 5) return excellent;
				if (Math.abs(value) <= 10) return good;
				return poor;

			case 'rmae':
				if (value == null || isNaN(value)) return '';
				if (value <= 10) return excellent;
				if (value <= 20) return good;
				return poor;

			case 'rrmse':
				if (value == null || isNaN(value)) return '';
				if (value <= 15) return excellent;
				if (value <= 25) return good;
				return poor;

			case 'correlation':
				if (value == null || isNaN(value)) return '';
				if (Math.abs(value) > 0.95) return excellent;
				if (Math.abs(value) > 0.8) return good;
				return poor;

			case 'hss':
				if (value == null || isNaN(value)) return '';
				if (value > 0.9) return excellent;
				if (value > 0) return good;
				return poor;

			default:
				return '';
		}
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
<!-- <pre>{JSON.stringify(scoresTables, null, 2)}</pre> -->

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
								{#each Object.values(row) as value, index}
									<td
										class="border border-gray-300 p-2 text-center"
										style={getCellColorClass(skill, value)}
									>
										{value === null || isNaN(value)
											? '--'
											: value.toFixed(scoresSecAxis.includes(skill) ? 2 : 1)}
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
