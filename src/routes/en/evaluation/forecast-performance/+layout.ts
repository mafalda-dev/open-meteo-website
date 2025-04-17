import type { LayoutLoad } from './$types';

import Rain from '$lib/assets/icons/rain.svelte';

export const load = (() => {
	return {
		Logo: Rain,
		heroImage: '/images/features_background.webp',
		heroHeight: 500,
		heroTitle: 'Forecast performance',
		heroDescription: 'Compare model performances at different lead times!',
		heroPrimaryButtonPath: '#available-apis',
		heroPrimaryButtonText: 'Available APIs',
		heroSecondaryButtonPath: '/en/pricing',
		heroSecondaryButtonText: 'Pricing'
	};
}) satisfies LayoutLoad;
