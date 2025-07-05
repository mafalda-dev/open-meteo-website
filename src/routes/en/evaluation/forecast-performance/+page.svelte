<script lang="ts">
	import { fade } from 'svelte/transition';
	import { fetchWeatherApi } from 'openmeteo';
	import { slide } from 'svelte/transition';
	import * as Alert from '$lib/components/ui/alert';
	import * as Select from '$lib/components/ui/select/index';

	import Button from '$lib/components/ui/button/button.svelte';
	import InfoCircle from 'lucide-svelte/icons/info';
	import ArrowClockwise from 'lucide-svelte/icons/refresh-cw';

	import { onMount } from 'svelte';
	import { countVariables } from '$lib/utils/meteo';
	import { urlHashStore } from '$lib/stores/url-hash-store';
	import { Input } from '$lib/components/ui/input';
	import LocationSelection from '$lib/components/location/location-selection.svelte';
	import LicenseSelector from '$lib/components/license/license-selector.svelte';
	import DatePicker from '$lib/components/date/date-picker.svelte';
	import Settings from '$lib/components/settings/settings.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import RadioGroup from '$lib/components/ui/radio-group/radio-group.svelte';
	import RadioGroupItem from '$lib/components/ui/radio-group/radio-group-item.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Accordion from '$lib/components/ui/accordion';
	import AccordionItem from '$lib/components/accordion/accordion-item.svelte';

	import {
		variables,
		models,
		solarVariables,
		windVariables,
		defaultParameters,
		referenceDatasets,
		hssVariables
	} from './options';
	import {
		pastHoursOptions,
		forecastHoursOptions,
		gridCellSelectionOptions,
		temporalResolutionOptions
	} from '../options';
	import Results from './Results.svelte';

	let d = new Date();
	d.setDate(d.getDate() - 2);
	let endDateDefault = d.toISOString().split('T')[0];
	d.setDate(d.getDate() - 14);
	let startDateDefault = d.toISOString().split('T')[0];
	const currentYear = d.getFullYear();
	const years: number[] = [];
	for (let year = 2024; year <= currentYear; year++) {
		years.push(year);
	}
	const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
	const previousDays = [0, 1, 2, 3, 4, 5, 6, 7];

	const params = urlHashStore({
		latitude: [52.52],
		longitude: [13.41],
		start_date: startDateDefault,
		end_date: endDateDefault,
		start_year: currentYear - 1,
		end_year: currentYear - 1,
		...defaultParameters
	});

	let begin_date = new Date('2024-01-01');
	let last_date = new Date();
	last_date.setDate(last_date.getDate() - 2);

	let accordionValues: string[] = $state([]);
	// onMount(() => {});

	function calculateMetrics(
		reference: Record<string, number>,
		forecast: Record<string, number>,
		calculateHss: boolean
	) {
		const keys = Object.keys(reference);

		let refValues: number[] = [],
			forecastValues: number[] = [],
			differences: number[] = [];

		let a = 0,
			b = 0,
			c = 0,
			d = 0; // confusion matrix counts for Heidke skill score

		for (const key of keys) {
			const ref = reference[key];
			const pred = forecast[key];

			// Skip if either value is null/undefined
			if (ref == null || pred == null || isNaN(ref) || isNaN(pred)) continue;

			const diff = ref - pred;

			differences.push(diff);
			refValues.push(ref);
			forecastValues.push(pred);

			if (calculateHss) {
				// For HSS — assumes binary inputs: 1 (event), 0 (no event)
				const refBin = ref >= 0.5 ? 1 : 0; // adjust threshold if needed
				const predBin = pred >= 0.5 ? 1 : 0;

				if (refBin === 1 && predBin === 1) a++;
				else if (refBin === 0 && predBin === 1) b++;
				else if (refBin === 1 && predBin === 0) c++;
				else if (refBin === 0 && predBin === 0) d++;
			}
		}
		const count = differences.length;
		if (count === 0) {
			return { rMBE: NaN, rMAE: NaN, rRMSE: NaN, corr: NaN, HSS: NaN };
		}
		const avgRef = refValues.reduce((sum, val) => sum + val, 0) / count;
		const rMBE = (differences.reduce((sum, d) => sum + d, 0) / (count * avgRef)) * 100;
		const rMAE = (differences.reduce((sum, d) => sum + Math.abs(d), 0) / (count * avgRef)) * 100;
		const rRMSE =
			(Math.sqrt(differences.reduce((sum, d) => sum + d * d, 0) / count) / avgRef) * 100;
		const corr = pearsonCorrelation(refValues, forecastValues);
		let HSS = NaN;
		if (calculateHss) {
			const denom = (a + c) * (c + d) + (a + b) * (b + d);
			HSS = denom === 0 ? NaN : (2 * (a * d - b * c)) / denom;
		}
		return { rMBE, rMAE, rRMSE, corr, HSS };
	}

	function pearsonCorrelation(x: number[], y: number[]): number {
		const n = x.length;
		const meanX = x.reduce((a, b) => a + b, 0) / n;
		const meanY = y.reduce((a, b) => a + b, 0) / n;

		let numerator = 0;
		let denomX = 0;
		let denomY = 0;

		for (let i = 0; i < n; i++) {
			const dx = x[i] - meanX;
			const dy = y[i] - meanY;
			numerator += dx * dy;
			denomX += dx * dx;
			denomY += dy * dy;
		}

		return numerator / Math.sqrt(denomX * denomY);
	}

	async function fetchData(formParams: Parameters) {
		let start_date = '';
		let end_date = '';
		if (formParams.time_mode == 'time_interval') {
			start_date = formParams.start_date;
			end_date = formParams.end_date;
		} else {
			start_date = `${formParams.start_year}-01-01`;
			end_date = `${formParams.end_year}-12-31`;
		}
		const variable = formParams.variable;
		const reference_model = formParams.reference;

		var reference = [];
		if (reference_model != 'day0') {
			const params = {
				latitude: formParams.latitude,
				longitude: formParams.longitude,
				hourly: [variable],
				models: reference_model,
				start_date: start_date,
				end_date: end_date
			};
			const url =
				reference_model == 'era5_seamless'
					? 'https://archive-api.open-meteo.com/v1/archive'
					: 'https://satellite-api.open-meteo.com/v1/archive';
			const responses = await fetchWeatherApi(url, params);
			reference = responses[0].hourly()!.variables(0)!.valuesArray()!;
		}

		const params = {
			latitude: formParams.latitude,
			longitude: formParams.longitude,
			hourly: [
				variable,
				variable + '_previous_day1',
				variable + '_previous_day2',
				variable + '_previous_day3',
				variable + '_previous_day4',
				variable + '_previous_day5',
				variable + '_previous_day6',
				variable + '_previous_day7'
			],
			models: formParams.models,
			start_date: start_date,
			end_date: end_date,
			reference: reference_model,
			time_mode: formParams.time_mode
		};
		const url = 'https://previous-runs-api.open-meteo.com/v1/forecast';
		const responses = await fetchWeatherApi(url, params);

		// Attributes for timezone, location, time series (just take 1st model response for these)
		const utcOffsetSeconds = responses[0].utcOffsetSeconds();
		const hourly = responses[0].hourly()!;
		const time = [
			...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())
		].map(
			(_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
		);
		const scores = {};
		const calculateHss = hssVariables.includes(params.hourly[0]) ? true : false;

		// Loop over weather models
		for (const [m, mod] of formParams.models.entries()) {
			const response = responses[m];
			const hourly = response.hourly()!;
			if (reference_model == 'day0') {
				reference = hourly.variables(0)!.valuesArray()!; // compare each model to its day0 forecast
			}
			// Initialize arrays to hold skill scores
			const rMBE: number[] = [];
			const rMAE: number[] = [];
			const rRMSE: number[] = [];
			const correlation: number[] = [];
			const hss: number[] = [];

			// Loop over previous days and fill skill scores arrays
			for (let i = 0; i < 8; i++) {
				let data = hourly.variables(i)!.valuesArray()!;
				const rMBE_prevday_i: number[] = [];
				const rMAE_prevday_i: number[] = [];
				const rRMSE_prevday_i: number[] = [];
				const correlation_prevday_i: number[] = [];
				const hss_prevday_i: number[] = [];
				if (formParams.time_mode == 'season') {
					for (let m = 0; m < 12; m++) {
						const filteredData = time
							.map((dateStr, index) => ({
								date: new Date(dateStr),
								value: data[index]
							}))
							.filter(({ date }) => date.getUTCMonth() === m)
							.map(({ value }) => value);
						const filteredRef = time
							.map((dateStr, index) => ({
								date: new Date(dateStr),
								value: reference[index]
							}))
							.filter(({ date }) => date.getUTCMonth() === m)
							.map(({ value }) => value);
						const metrics = calculateMetrics(filteredRef, filteredData, calculateHss);
						rMBE_prevday_i.push(metrics.rMBE); // array(12)
						rMAE_prevday_i.push(metrics.rMAE); // array(12)
						rRMSE_prevday_i.push(metrics.rRMSE); // array(12)
						correlation_prevday_i.push(metrics.corr); // array(12)
						hss_prevday_i.push(metrics.HSS); // array(12)
					}
					rMBE.push(rMBE_prevday_i); // array(8x12)
					rMAE.push(rMAE_prevday_i); // array(8x12)
					rRMSE.push(rRMSE_prevday_i); // array(8x12)
					correlation.push(correlation_prevday_i); // array(8x12)
					hss.push(hss_prevday_i); // array(8x12)
				} else {
					const metrics = calculateMetrics(reference, data, calculateHss);
					rMBE.push(metrics.rMBE);
					rMAE.push(metrics.rMAE);
					rRMSE.push(metrics.rRMSE);
					correlation.push(metrics.corr);
					hss.push(metrics.HSS);
				}
			}
			// Assign skill scores arrays to scores dictionary
			scores['rmbe_' + String(mod)] = rMBE;
			scores['rmae_' + String(mod)] = rMAE;
			scores['rrmse_' + String(mod)] = rRMSE;
			scores['correlation_' + String(mod)] = correlation;
			scores['hss_' + String(mod)] = hss;
		}

		return { params: params, scores: scores};
	}

	let result: Promise<any> = $state(Promise.resolve(null));

	async function load() {
		return await fetchData($params);
	}

	function reset() {
		result = Promise.resolve(null);
	}

	function reload() {
		result = load();
	}

	onMount(() => {
		reload();
	});

	params.subscribe(reset);
</script>

<svelte:head>
	<title>⚡️ Forecast performance | Open-Meteo.com</title>
	<link rel="canonical" href="https://open-meteo.com/en/evaluation/forecast-performance" />
	<meta name="description" content="" />
</svelte:head>

<div class="container my-12">
	<!-- LOCATION -->
	<LocationSelection bind:params={$params} />

	<!-- TIME -->
	<div class="mt-6">
		<div class="mt-3 flex items-center gap-2">
			<div class="text-muted-foreground">Time:</div>
			<div class="border-border flex rounded-md border">
				<Button
					variant="ghost"
					class="rounded-e-none !opacity-100 gap-1 duration-300 {$params.time_mode ===
					'time_interval'
						? 'bg-accent cursor-not-allowed'
						: ''}"
					disabled={$params.time_mode === 'time_interval'}
					onclick={() => {
						$params.time_mode = 'time_interval';
					}}
				>
					<svg
						class="lucide lucide-clock mr-[2px]"
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10" />
						<polyline points="12 6 12 12 16 14" />
					</svg>Time interval
				</Button>
				<Button
					variant="ghost"
					class="rounded-s-none !opacity-100 gap-1 duration-300  {$params.time_mode === 'season'
						? 'bg-accent'
						: ''}"
					disabled={$params.time_mode === 'season'}
					onclick={() => {
						$params.time_mode = 'season';
					}}
				>
					<svg
						class="lucide lucide-calendar-cog mr-[2px]"
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15.2 16.9-.9-.4" />
						<path d="m15.2 19.1-.9.4" />
						<path d="M16 2v4" />
						<path d="m16.9 15.2-.4-.9" />
						<path d="m16.9 20.8-.4.9" />
						<path d="m19.5 14.3-.4.9" />
						<path d="m19.5 21.7-.4-.9" />
						<path d="M21 10.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
						<path d="m21.7 16.5-.9.4" />
						<path d="m21.7 19.5-.9-.4" />
						<path d="M3 10h18" />
						<path d="M8 2v4" />
						<circle cx="18" cy="18" r="3" />
					</svg>Season
				</Button>
			</div>
		</div>
		<div class="mt-3 md:mt-4">
			{#if $params.time_mode === 'time_interval'}
				<div in:fade class="flex flex-col gap-4 lg:flex-row">
					<div class="mb-3 lg:w-1/2">
						<DatePicker
							bind:start_date={$params.start_date}
							bind:end_date={$params.end_date}
							{begin_date}
							{last_date}
						/>
					</div>
				</div>
			{/if}
			{#if $params.time_mode === 'season'}
				<div class="relative flex flex-col gap-2 duration-200">
					<Input
						type="number"
						class="h-12 pt-6"
						name="Start year"
						id="start_year"
						step="1"
						min="2024"
						max={currentYear}
						bind:value={$params.start_year}
					/>
					<Label
						class="text-muted-foreground absolute left-2 top-[0.35rem] z-10 px-1 text-xs"
						for="start_year">Start year</Label
					>
					{#if $params.start_year < 2024 || $params.start_year > currentYear || $params.start_year > $params.end_year}
						<div class="absolute left-3 top-14 text-sm duration-300" transition:slide>
							Start year must be between 2024 and the current year. Start year must be before End
							year
						</div>
					{/if}
				</div>
				<div class="relative flex flex-col gap-2 duration-200">
					<Input
						type="number"
						class="h-12 pt-6"
						name="End year"
						id="end_year"
						step="1"
						min="2024"
						max={currentYear}
						bind:value={$params.end_year}
					/>
					<Label
						class="text-muted-foreground absolute left-2 top-[0.35rem] z-10 px-1 text-xs"
						for="end_year">End year</Label
					>
					{#if $params.end_year < 2024 || $params.end_year > currentYear || $params.start_year > $params.end_year}
						<div class="absolute left-3 top-14 text-sm duration-300" transition:slide>
							End year must be between 2024 and the current year. End year must be after Start year
						</div>
					{/if}
				</div>
				<div class="relative">
					<Select.Root name="previous_days" type="single" bind:value={$params.past_days}>
						<Select.Trigger aria-label="Previous days" class="h-12 cursor-pointer pt-6 [&_svg]:mb-3"
							>{$params.past_days?.toString()}</Select.Trigger
						>
						<Select.Content preventScroll={false} class="border-border">
							{#each previousDays as to}
								<Select.Item value={to.toString()}>{to}</Select.Item>
							{/each}
						</Select.Content>
						<Label class="text-muted-foreground absolute left-2 top-[0.35rem] z-10 px-1 text-xs"
							>Previous days</Label
						>
					</Select.Root>
				</div>
			{/if}
		</div>
	</div>

	<!-- VARIABLES -->
	<div class="mt-6 md:mt-12">
		<h2 id="weather_variables" class="text-2xl md:text-3xl">Weather Variables</h2>
		<div
			class="mt-2 grid grid-flow-row gap-x-2 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
		>
			<RadioGroup name="variable" bind:value={$params.variable}>
				<div class="flex items-center space-x-2">
					{#each variables as group}
						<div>
							{#each group as e}
								<div class="group flex items-center" title={e.label}>
									<RadioGroupItem
										id="{e.value}_hourly"
										class="bg-muted/50 border-border-dark cursor-pointer duration-100 group-hover:border-[currentColor]"
										value={e.value}
									/>
									<Label
										id="{e.value}_label"
										for="{e.value}_hourly"
										class="ml-[0.42rem] cursor-pointer truncate py-[0.1rem]">{e.label}</Label
									>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			</RadioGroup>
		</div>
	</div>

	<!-- ADDITIONAL VARIABLES -->
	<div class="mt-6">
		<Accordion.Root class="border-border rounded-lg border" bind:value={accordionValues}>
			<AccordionItem id="solar-variables" title="Solar Radiation Variables">
				<RadioGroup name="solar-variables" bind:value={$params.variable}>
					<div class="flex items-center space-x-2">
						{#each solarVariables as group}
							<div>
								{#each group as e}
									<div class="group flex items-center" title={e.label}>
										<RadioGroupItem
											id="{e.value}_hourly"
											class="bg-muted/50 border-border-dark cursor-pointer duration-100 group-hover:border-[currentColor]"
											value={e.value}
										/>
										<Label
											id="{e.value}_hourly_label"
											for="{e.value}_hourly"
											class="ml-[0.42rem] cursor-pointer truncate py-[0.1rem]">{e.label}</Label
										>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				</RadioGroup>

				<small class="text-muted-foreground mt-1">
					Note: Solar radiation is averaged over the past hour. Use
					<mark>instant</mark> for radiation at the indicated time. For global tilted irradiance GTI
					please specify Tilt and Azimuth below.
				</small>

				<div class="mt-3 grid grid-cols-1 gap-3 md:mt-6 md:grid-cols-2 md:gap-6">
					<div class="relative">
						<Input
							id="tilt"
							type="number"
							class="h-12 cursor-pointer pt-6 {$params.tilt < 0 || $params.tilt > 90
								? 'text-red'
								: ''}"
							name="tilt"
							step="1"
							min="0"
							max="90"
							bind:value={$params.tilt}
						/>
						<Label
							class="text-muted-foreground absolute left-2 top-[0.35rem] z-10 px-1 text-xs"
							for="tilt">Panel Tilt (0° horizontal)</Label
						>
						{#if $params.tilt < 0 || $params.tilt > 90}
							<div class="invalid-tooltip" transition:slide>Tilt must be between 0° and 90°</div>
						{/if}
					</div>

					<div class="relative">
						<Input
							type="number"
							class="h-12 cursor-pointer pt-6 {$params.azimuth < -180 || $params.azimuth > 180
								? 'text-red'
								: ''}"
							name="azimuth"
							id="azimuth"
							step="1"
							min="-180"
							max="180"
							bind:value={$params.azimuth}
						/>
						<Label
							class="text-muted-foreground absolute left-2 top-[0.35rem] z-10 px-1 text-xs"
							for="azimuth">Panel Azimuth (0° S, -90° E, 90° W, ±180° N)</Label
						>
						{#if Number($params.azimuth) < -180 || Number($params.azimuth) > 180}
							<div class="invalid-tooltip" transition:slide>
								Azimuth must be between -180° (north) and 180° (north)
							</div>
						{/if}
					</div>
				</div>
			</AccordionItem>
			<AccordionItem id="wind-variables" title="Wind at 80, 120 and 180 meters">
				<RadioGroup name="wind-variables" bind:value={$params.variable}>
					<div class="flex items-center space-x-2">
						{#each windVariables as group}
							<div>
								{#each group as e}
									<div class="group flex items-center" title={e.label}>
										<RadioGroupItem
											id="{e.value}_hourly"
											class="bg-muted/50 border-border-dark cursor-pointer duration-100 group-hover:border-[currentColor]"
											value={e.value}
										/>
										<Label
											id="{e.value}_hourly_label"
											for="{e.value}_hourly"
											class="ml-[0.42rem] cursor-pointer truncate py-[0.1rem]">{e.label}</Label
										>
									</div>
								{/each}
							</div>
						{/each}
					</div>
				</RadioGroup>
			</AccordionItem>
		</Accordion.Root>
	</div>

	<!-- MODELS -->
	<div class="mt-6 md:mt-12">
		<h2 id="weather_models" class="text-2xl md:text-3xl">Weather Models</h2>
		<div
			class="mt-2 grid grid-flow-row gap-x-2 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
		>
			{#each models as group}
				<div>
					{#each group as e}
						<div class="group flex items-center" title={e.label}>
							<Checkbox
								id="{e.value}_model"
								class="bg-muted/50 border-border-dark cursor-pointer duration-100 group-hover:border-[currentColor]"
								value={e.value}
								checked={$params.models?.includes(e.value)}
								aria-labelledby="{e.value}_label"
								onCheckedChange={() => {
									if ($params.models?.includes(e.value)) {
										$params.models = $params.models.filter((item) => {
											return item !== e.value;
										});
									} else {
										$params.models?.push(e.value);
										$params.models = $params.models;
									}
								}}
							/>
							<Label
								id="{e.value}_model_label"
								for="{e.value}_model"
								class="ml-[0.42rem] cursor-pointer truncate py-[0.1rem]">{e.label}</Label
							>
						</div>
					{/each}
				</div>
			{/each}
		</div>
		<div>
			<small class="text-muted-foreground"
				>Note: The default <mark>Best Match</mark> provides the best forecast for any given location
				worldwide. <mark>Seamless</mark> combines all models from a given provider into a seamless prediction.</small
			>
		</div>
	</div>

	<!-- REFERENCE -->
	<div class="mt-6 md:mt-12">
		<h2 id="reference" class="text-2xl md:text-3xl">Reference data</h2>
		<div
			class="mt-2 grid grid-flow-row gap-x-2 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
		>
			<RadioGroup name="reference" bind:value={$params.reference}>
				<div class="flex items-center space-x-2">
					<div>
						{#each referenceDatasets as e}
							<div class="group flex items-center" title={e.label}>
								<RadioGroupItem
									id="{e.value}_ref"
									class="bg-muted/50 border-border-dark cursor-pointer duration-100 group-hover:border-[currentColor]"
									value={e.value}
								/>
								<Label
									id="{e.value}_model_label"
									for="{e.value}_model"
									class="ml-[0.42rem] cursor-pointer truncate py-[0.1rem]">{e.label}</Label
								>
							</div>
						{/each}
					</div>
				</div>
			</RadioGroup>
		</div>
	</div>

	<!-- SETTINGS -->
	<div class="mt-6 md:mt-12">
		<Settings bind:params={$params} />
	</div>

	<!-- LICENSE -->
	<div class="mt-3 md:mt-6"><LicenseSelector /></div>

	<!-- RESULT -->
	<div class="mt-6 md:mt-12">
		{#await result}
			<div class="text-muted-foreground flex items-center">
				<InfoCircle class="mr-2" />
				Loading...
			</div>
		{:then result}
			{#if result}
				<Results data={result}></Results>
			{:else}
				<div in:fade style="min-height: 400px" class="-mx-6 relative md:mx-0">
					<div transition:fade={{ duration: 300 }} style="min-height: 400px">
						<div
							class="border-border border rounded-lg absolute top-0 flex h-full w-full px-6 items-center justify-center"
						>
							<Alert.Root class="border-border my-auto w-[unset] md:!pl-8">
								<Alert.Description>
									<div class="flex items-center flex-col md:flex-row justify-center gap-2">
										<div class="text-muted-foreground flex items-center">
											<InfoCircle class="mr-2" />
											Parameters have changed.
										</div>

										<Button variant="ghost" type="submit" class="flex !flex-row" onclick={reload}
											><ArrowClockwise class="mr-1" />Reload Chart
										</Button>
									</div>
								</Alert.Description>
							</Alert.Root>
						</div>
					</div>
				</div>
			{/if}
		{:catch error}
			Error: {error}
		{/await}
	</div>
</div>
