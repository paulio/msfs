// Split runtime and type-only imports for Rollup v2 compatibility (no inline `type` keywords)
import { FSComponent, DisplayComponent, ComponentProps, ConsumerSubject } from '@microsoft/msfs-sdk';
import type { VNode, EventBus, Subscribable } from '@microsoft/msfs-sdk';
import './MyComponent.css';

/** Props for the multi-gauge panel component. */
interface MyComponentProps extends ComponentProps {
    bus: EventBus;
}

/** Event bus topics published by the instrument Update loop. */
export interface PanelEvents {
    indicated_airspeed: number;      // knots
    fuel_total_gal: number;          // gallons
    fuel_total_capacity: number;     // gallons capacity
    flaps_index: number;             // handle detent index
    flaps_percent: number;           // trailing edge flaps percent (0-100)
}

/**
 * MyComponent now renders a small panel with 3 (4 values) gauges:
 *  - Airspeed (KIAS)
 *  - Fuel (Gallons & % of capacity if desired later)
 *  - Flaps (index & percent)
 */
export class MyComponent extends DisplayComponent<MyComponentProps> {
    private readonly indicatedAirspeed: Subscribable<number>;
    private readonly fuelTotalGal: Subscribable<number>;
    private readonly fuelCapacityGal: Subscribable<number>;
    private readonly flapsIndex: Subscribable<number>;
    private readonly flapsPercent: Subscribable<number>;

    private ringFuelRef = FSComponent.createRef<SVGPathElement>();
    private fuelTextRef = FSComponent.createRef<HTMLDivElement>();

    constructor(props: MyComponentProps) {
        super(props);

        const sub = this.props.bus.getSubscriber<PanelEvents>();

        this.indicatedAirspeed = ConsumerSubject.create(
            sub.on('indicated_airspeed').withPrecision(0),
            0
        );
        this.fuelTotalGal = ConsumerSubject.create(sub.on('fuel_total_gal').withPrecision(1), 0);
        this.fuelCapacityGal = ConsumerSubject.create(sub.on('fuel_total_capacity').withPrecision(1), 1);
        this.flapsIndex = ConsumerSubject.create(
            sub.on('flaps_index').withPrecision(0),
            0
        );
        this.flapsPercent = ConsumerSubject.create(
            sub.on('flaps_percent').withPrecision(0),
            0
        );
    }

    /** Determine color based on fraction remaining */
    private calcFuelColor(frac: number): string {
        if (frac >= 0.75) return '#00ff6a';      // green
        if (frac >= 0.50) return '#b4ff22';      // yellow-green
        if (frac >= 0.30) return '#ffc400';      // amber
        if (frac >= 0.15) return '#ff8200';      // orange
        return '#ff3232';                        // red
    }

    public onAfterRender(): void {
        // Subscribe to fuel changes and update CSS variables for the arc
        const updateFuelVisual = () => {
            const total = Number(this.fuelTotalGal.get());
            const cap = Math.max(1, Number(this.fuelCapacityGal.get()));
            const frac = Math.min(1, Math.max(0, total / cap));
            const color = this.calcFuelColor(frac);
            const pathEl = this.ringFuelRef.instance;
            // Arc parameters
            const r = 88;            // radius
            const startAngle = -135; // degrees (start of 270° window)
            const windowDeg = 270;   // total sweep window
            const sweep = windowDeg * frac; // current visible sweep
            if (pathEl) {
                if (frac <= 0.0005) {
                    // Empty: clear path (or draw a tiny dot)
                    pathEl.setAttribute('d', '');
                } else {
                    const endAngle = startAngle + sweep;
                    const toRad = (deg: number) => (deg * Math.PI) / 180;
                    const polar = (angDeg: number) => ({
                        x: 100 + r * Math.cos(toRad(angDeg)),
                        y: 100 + r * Math.sin(toRad(angDeg))
                    });
                    const start = polar(startAngle);
                    const end = polar(endAngle);
                    // large-arc-flag is 1 if sweep > 180°
                    const largeArc = sweep > 180 ? 1 : 0;
                    // Sweep flag 1 for clockwise since angles increase
                    const d = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
                    pathEl.setAttribute('d', d);
                }
                pathEl.setAttribute('stroke', color);
            }
            const txt = this.fuelTextRef.instance;
            if (txt) {
                txt.style.color = frac < 0.15 ? '#ff9090' : '#9adfff';
            }
        };

        (this.fuelTotalGal as any).sub?.(updateFuelVisual, true);
        (this.fuelCapacityGal as any).sub?.(updateFuelVisual, true);
        // Initial paint in case neither subject triggers immediately
        updateFuelVisual();
    }

    public render(): VNode {
        // Precomputed full 270° track path (start -135°, end +135°)
        const trackD = 'M 37.78 37.78 A 88 88 0 1 1 37.78 162.22';
        return (
            <div class='my-component futuristic'>
                <div class='radial-wrapper'>
                    <svg class='fuel-radial' viewBox='0 0 200 200'>
                        <path class='ring-track' d={trackD} />
                        {/* Dynamic arc path replacing stroke-dash technique */}
                        <path class='ring-fuel' ref={this.ringFuelRef} />
                    </svg>
                    <div class='speed-core'>
                        <div class='speed-label'>SPEED</div>
                        <div class='speed-value'>{this.indicatedAirspeed}</div>
                        <div class='speed-unit'>KT</div>
                    </div>
                </div>
                <div class='fuel-line' ref={this.fuelTextRef}>FUEL {this.fuelTotalGal} / {this.fuelCapacityGal}<span class='unit'>GAL</span></div>
                <div class='flaps-bottom'>FLAPS {this.flapsIndex} ({this.flapsPercent}%)</div>
            </div>
        );
    }
}