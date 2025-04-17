export const defaultParameters = {
	daily: [],
	hourly: [],
	models: [],
	minutely_15: [],

	timezone: 'UTC',
	location_mode: 'location_search',
	csv_coordinates: undefined,

	time_mode: 'time_interval',

	cell_selection: undefined,
	temporal_resolution: undefined,

	tilt: '0',
	azimuth: '0',

	timeformat: 'iso8601',
	wind_speed_unit: 'kmh',
	temperature_unit: 'celsius',
	precipitation_unit: 'mm'
};

export const pressureVariables = [
	{ value: 'temperature', label: 'Temperature' },
	{ value: 'relative_humidity', label: 'Relative Humidity' },
	{ value: 'cloud_cover', label: 'Cloud cover' },
	{ value: 'wind_speed', label: 'Wind Speed' },
	{ value: 'wind_direction', label: 'Wind Direction' },
	{ value: 'geopotential_height', label: 'Geopotential Height' }
];

export const levels = [
	30, 50, 70, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900, 925, 950, 975, 1000
].reverse();

export const hourly = [
	[
		{ value: 'temperature_2m', label: 'Temperature (2 m)' },
		{ value: 'relative_humidity_2m', label: 'Relative Humidity (2 m)' },
		{ value: 'dew_point_2m', label: 'Dewpoint (2 m)' },
		{ value: 'apparent_temperature', label: 'Apparent Temperature' },
		{ value: 'precipitation', label: 'Precipitation (rain + showers + snow)' },
		
	],
	[
		{ value: 'rain', label: 'Rain' },
		{ value: 'showers', label: 'Showers' },
		{ value: 'snowfall', label: 'Snowfall' },
		{ value: 'weather_code', label: 'Weather code' },
		{ value: 'cloud_cover', label: 'Cloud cover Total' },
	],
	[
		{ value: 'pressure_msl', label: 'Sealevel Pressure' },
		{ value: 'surface_pressure', label: 'Surface Pressure' },
		{ value: 'wind_speed_10m', label: 'Wind Speed (10 m)' },
		{ value: 'wind_direction_10m', label: 'Wind Direction (10 m)' },
	],
];

export const additionalVariables = [
	[
		{ value: 'uv_index', label: 'UV Index' },
		{ value: 'uv_index_clear_sky', label: 'UV Index Clear Sky' },
		{ value: 'is_day', label: 'Is Day or Night' },
		{ value: 'sunshine_duration', label: 'Sunshine Duration' },
		{ value: 'wet_bulb_temperature_2m', label: 'Wet Bulb Temperature (2 m)' },
		{
			value: 'total_column_integrated_water_vapour',
			label: 'Total Column Integrated Water Vapour'
		}
	],
	[
		{ value: 'cape', label: 'CAPE' },
		{ value: 'lifted_index', label: 'Lifted Index' },
		{ value: 'convective_inhibition', label: 'Convective Inhibition' },
		{ value: 'freezing_level_height', label: 'Freezing Level Height' },
		{ value: 'boundary_layer_height', label: 'Boundary Layer Height PBL' },
		{ value: 'hail', label: 'Hail (only Met Office UK 2km)' }
	]
];

export const solarVariables = [
	[
		{ value: 'shortwave_radiation', label: 'Shortwave Solar Radiation GHI' },
		{ value: 'direct_radiation', label: 'Direct Solar Radiation' },
		{ value: 'diffuse_radiation', label: 'Diffuse Solar Radiation DHI' },
		{ value: 'direct_normal_irradiance', label: 'Direct Normal Irradiance DNI' },
		{ value: 'global_tilted_irradiance', label: 'Global Tilted Radiation GTI' },
	],
	[
		{ value: 'shortwave_radiation_instant', label: 'Shortwave Solar Radiation GHI (Instant)' },
		{ value: 'direct_radiation_instant', label: 'Direct Solar Radiation (Instant)' },
		{ value: 'diffuse_radiation_instant', label: 'Diffuse Solar Radiation DHI (Instant)' },
		{ value: 'direct_normal_irradiance_instant', label: 'Direct Normal Irradiance DNI (Instant)' },
		{ value: 'global_tilted_irradiance_instant', label: 'Global Tilted Radiation GTI (Instant)' },
	]
];

export const windVariables = [[
	{ value: 'wind_speed_80m', label: 'Wind Speed (80 m)' },
	{ value: 'wind_speed_120m', label: 'Wind Speed (120 m)' },
	{ value: 'wind_speed_180m', label: 'Wind Speed (180 m)' },
	{ value: 'wind_direction_80m', label: 'Wind Direction (80 m)' },
	{ value: 'wind_direction_120m', label: 'Wind Direction (120 m)' },
	{ value: 'wind_direction_180m', label: 'Wind Direction (180 m)' }
]];

export const models = [
	[
		{ value: 'best_match', label: 'Best match' },
		{ value: 'ecmwf_ifs025', label: 'ECMWF IFS 0.25°' },
		{ value: 'ecmwf_aifs025_single', label: 'ECMWF AIFS 0.25° Single' },
		{ value: 'cma_grapes_global', label: 'CMA GRAPES Global' },
		{ value: 'bom_access_global', label: 'BOM ACCESS Global' }
	],
	[
		{ value: 'gfs_seamless', label: 'NCEP GFS Seamless' },
		{ value: 'gfs_global', label: 'NCEP GFS Global 0.11°/0.25°' },
		{ value: 'gfs_hrrr', label: 'NCEP HRRR U.S. Conus' },
		{ value: 'ncep_nbm_conus', label: 'NCEP NBM U.S. Conus' },
		{ value: 'gfs_graphcast025', label: 'GFS GraphCast' }
	],
	[
		{ value: 'jma_seamless', label: 'JMA Seamless' },
		{ value: 'jma_msm', label: 'JMA MSM' },
		{ value: 'jma_gsm', label: 'JMA GSM' }
	],
	[
		{ value: 'icon_seamless', label: 'DWD ICON Seamless' },
		{ value: 'icon_global', label: 'DWD ICON Global' },
		{ value: 'icon_eu', label: 'DWD ICON EU' },
		{ value: 'icon_d2', label: 'DWD ICON D2' }
	],
	[
		{ value: 'gem_seamless', label: 'GEM Seamless' },
		{ value: 'gem_global', label: 'GEM Global' },
		{ value: 'gem_regional', label: 'GEM Regional' },
		{ value: 'gem_hrdps_continental', label: 'GEM HRDPS Continental' }
	],
	[
		{ value: 'meteofrance_seamless', label: 'Météo-France Seamless' },
		{ value: 'meteofrance_arpege_world', label: 'Météo-France ARPEGE World' },
		{ value: 'meteofrance_arpege_europe', label: 'Météo-France ARPEGE Europe' },
		{ value: 'meteofrance_arome_france', label: 'Météo-France AROME France' },
		{ value: 'meteofrance_arome_france_hd', label: 'Météo-France AROME France HD' }
	],
	[
		{ value: 'arpae_cosmo_seamless', label: 'ARPAE Seamless' },
		{ value: 'arpae_cosmo_2i', label: 'ARPAE COSMO 2I' },
		{ value: 'arpae_cosmo_5m', label: 'ARPAE COSMO 5M' }
	],
	[
		{ value: 'metno_seamless', label: 'MET Norway Nordic Seamless (with ECMWF)' },
		{ value: 'metno_nordic', label: 'MET Norway Nordic' }
	],
	[
		{ value: 'knmi_seamless', label: 'KNMI Seamless (with ECMWF)' },
		{ value: 'knmi_harmonie_arome_europe', label: 'KNMI Harmonie Arome Europe' },
		{ value: 'knmi_harmonie_arome_netherlands', label: 'KNMI Harmonie Arome Netherlands' },
		{ value: 'dmi_seamless', label: 'DMI Seamless (with ECMWF)' },
		{ value: 'dmi_harmonie_arome_europe', label: 'DMI Harmonie Arome Europe' }
	],
	[
		{ value: 'ukmo_seamless', label: 'UK Met Office Seamless' },
		{ value: 'ukmo_global_deterministic_10km', label: 'UK Met Office Global 10km' },
		{ value: 'ukmo_uk_deterministic_2km', label: 'UK Met Office UK 2km' }
	]
];

export const referenceDatasets = [
	[
		{ value: 'day0', label: 'Day 0 Forecast' },
		{ value: 'era5_seamless', label: 'ERA5-Seamless' },
		{ value: 'satellite_radiation_seamless', label: 'Satellite automatic selection (radiation variables only)' },
	]
];

export const skillScores = [
	[
		{ value: 'rmbe', label: 'rMBE (%)' },
		{ value: 'rmae', label: 'rMAE (%)' },
		{ value: 'rrmse', label: 'rRMSE (%)' },
		{ value: 'r2', label: 'Correlation' },
	]
];

export const forecastDaysOptions = [{ value: '1', label: '1 day (default)' }];
