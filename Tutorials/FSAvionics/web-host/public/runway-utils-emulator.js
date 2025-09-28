// runway-utils-emulator.js
// Lightweight emulation of a subset of MSFS SDK RunwayUtils helpers for local browser testing.
// Extend as you need more fidelity.
(function(global){
  // Emulate RunwayDesignator enum (numeric constants)
  const RunwayDesignator = {
    RUNWAY_DESIGNATOR_NONE: 0,
    RUNWAY_DESIGNATOR_LEFT: 1,
    RUNWAY_DESIGNATOR_RIGHT: 2,
    RUNWAY_DESIGNATOR_CENTER: 3,
    RUNWAY_DESIGNATOR_WATER: 4
  };

  const RunwayUtils = {
    RunwayDesignator,
    // Mapping analogous to SDK's RUNWAY_DESIGNATOR_LETTERS
    RUNWAY_DESIGNATOR_LETTERS: {
      0: '',   // NONE
      1: 'L',  // LEFT
      2: 'R',  // RIGHT
      3: 'C',  // CENTER
      4: 'W'   // WATER (rare)
    },
    /**
     * Normalize a raw runway ident string (e.g. "9l", "09L", "27", "36C") to canonical form (zero padded, side uppercased).
     */
    normalizeIdent(ident){
      if (!ident) return '';
      const trimmed = ident.toString().trim().toUpperCase();
      const match = trimmed.match(/^([0-9]{1,2})([LRCW]?)(?:$)/); // W = water (occasionally used)
      if(!match) return trimmed; // return as-is if pattern unknown
      let num = parseInt(match[1], 10);
      if (num === 0) num = 36; // treat 00 as 36 if encountered
      if (num < 1) num = 1; if (num > 36) num = ((num - 1) % 36) + 1;
      const side = match[2] || '';
      return `${num.toString().padStart(2,'0')}${side}`;
    },

    /**
     * Extract runway number (1..36) from ident; returns null if not valid.
     */
    getRunwayNumber(ident){
      const n = this.normalizeIdent(ident).substring(0,2);
      const num = parseInt(n,10);
      return (num>=1 && num<=36) ? num : null;
    },

    /**
     * Extract side designator (L/R/C/W or '') from ident.
     */
    getRunwaySide(ident){
      const norm = this.normalizeIdent(ident);
      return norm.length>2 ? norm[2] : '';
    },

    /**
     * Compute reciprocal runway ident (opposite heading). Preserves side mapping (L<->R, C->C).
     *  Heading logic: add/subtract 18 (i.e., 180 degrees) and wrap.
     */
    getReciprocalIdent(ident){
      const num = this.getRunwayNumber(ident);
      if (!num) return '';
      const side = this.getRunwaySide(ident);
      let recip = num + 18;
      if (recip > 36) recip -= 36;
      // Swap side: L <-> R, C stays C, W stays W, blank stays blank.
      const sideMap = { 'L':'R','R':'L','C':'C','W':'W' };
      const recipSide = sideMap[side] || side;
      return `${recip.toString().padStart(2,'0')}${recipSide}`;
    },

    /**
     * Build a friendly label (e.g. RWY 09L / 27R) combining ident and reciprocal.
     */
    formatPair(ident){
      const norm = this.normalizeIdent(ident);
      const recip = this.getReciprocalIdent(norm);
      if (!norm) return '';
      return `RWY ${norm} / ${recip}`;
    },

    /**
     * Estimate approximate magnetic heading centerline in degrees for the runway ident (simple 10 * number rule).
     */
    headingDegrees(ident){
      const num = this.getRunwayNumber(ident);
      if (!num) return null;
      return (num % 36) * 10; // 36 -> 0 deg (360)
    },

    /**
     * Return an object with parsed data.
     */
    parse(ident){
      const norm = this.normalizeIdent(ident);
      if(!norm) return null;
      const sideChar = this.getRunwaySide(norm);
      const designator = sideChar === 'L' ? RunwayDesignator.RUNWAY_DESIGNATOR_LEFT
                       : sideChar === 'R' ? RunwayDesignator.RUNWAY_DESIGNATOR_RIGHT
                       : sideChar === 'C' ? RunwayDesignator.RUNWAY_DESIGNATOR_CENTER
                       : sideChar === 'W' ? RunwayDesignator.RUNWAY_DESIGNATOR_WATER
                       : RunwayDesignator.RUNWAY_DESIGNATOR_NONE;
      return {
        original: ident,
        ident: norm,
        number: this.getRunwayNumber(norm),
        side: sideChar,
        designator,
        reciprocal: this.getReciprocalIdent(norm),
        heading: this.headingDegrees(norm)
      };
    }
  };

  global.RunwayUtils = RunwayUtils;
  global.RunwayDesignator = RunwayDesignator; // expose separately for code expecting standalone enum
  console.info('[RunwayUtilsEmu] Initialized');
})(window);
