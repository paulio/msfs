/// <reference types="@microsoft/msfs-types/pages/vcockpit/core/vcockpit" />
/// <reference types="@microsoft/msfs-types/js/simvar" />
import { EventBus, FSComponent } from '@microsoft/msfs-sdk';
// Split value and type imports for compatibility with older Rollup/Acorn parsing
import { MyComponent } from './MyComponent';
import type { PanelEvents } from './MyComponent';
import './MyComponent.css';

class MyInstrument extends BaseInstrument {
    private readonly eventBus = new EventBus();

    get templateID(): string {
        return 'MyInstrument';
    }

    public connectedCallback(): void {
        super.connectedCallback();
        const attemptRender = (attempt: number) => {
            const target = document.getElementById('InstrumentContent');
            if (!target) {
                if (attempt < 5) {
                    console.warn(`[MyInstrument] InstrumentContent not found (attempt ${attempt}) – retrying next frame`);
                    requestAnimationFrame(() => attemptRender(attempt + 1));
                } else {
                    console.error('[MyInstrument] Failed to locate InstrumentContent after retries');
                }
                return;
            }
            try {
                FSComponent.render(<MyComponent bus={this.eventBus} />, target);
                console.info('[MyInstrument] Rendered MyComponent into InstrumentContent');
            } catch (e) {
                console.error('[MyInstrument] Render error', e);
            }
        };
        attemptRender(1);
    }

    public Update(): void {
        const publisher = this.eventBus.getPublisher<PanelEvents>();

        // Airspeed in knots indicated
        const indicatedAirspeed = SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots');
        publisher.pub('indicated_airspeed', indicatedAirspeed, true);

    // Total fuel quantity (usable gallons) and capacity for percent calculation.
    const fuelTotalGal = SimVar.GetSimVarValue('FUEL TOTAL QUANTITY', 'gallons');
    const fuelCapacityGal = SimVar.GetSimVarValue('FUEL TOTAL CAPACITY', 'gallons');
    publisher.pub('fuel_total_gal', fuelTotalGal, true);
    publisher.pub('fuel_total_capacity', fuelCapacityGal, true);

        // Flaps handle index (detent) and flaps position percent (0-100)
        const flapsIndex = SimVar.GetSimVarValue('FLAPS HANDLE INDEX', 'Number');
        const flapsPercent = SimVar.GetSimVarValue('TRAILING EDGE FLAPS LEFT PERCENT', 'Percent');
        publisher.pub('flaps_index', flapsIndex, true);
        publisher.pub('flaps_percent', flapsPercent, true);
    }
}

registerInstrument('my-instrument', MyInstrument);