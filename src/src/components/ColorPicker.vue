<!-- https://codepen.io/Brownsugar/pen/NaGPKy -->

<template>
  <div class="color-picker" ref="colorpicker">

    <span class="color-picker-input-container">
      <input
        class="color-picker-input"
        type="text"
        v-model="colorValue"
        @focus="showPicker()"
        @input="updateFromInput()"
        @keyup.enter="hidePicker()"></input>
    </span>

    <span
      @mouseenter="showPicker()"
      @mouseleave="hidePicker()"
      class="color-picker-preview-container">

      <span
        class="current-color"
        :style="`background-color: ${colorValue}`"
        @click="togglePicker()"></span>

      <chrome-picker id="picker" :value="colors" @input="updateFromPicker" v-if="displayPicker" />

    </span>

  </div>
</template>


<script>
/* eslint no-unused-expressions: ["error", { "allowShortCircuit": true, "allowTernary": true }] */

import { Chrome } from 'vue-color';

export default {
  name: 'ColorPicker',
  components: {
    'chrome-picker': Chrome,
  },
  props: ['color'],
  data() {
    return {
      colors: {
        hex: '#000000',
      },
      colorValue: '',
      displayPicker: false,
    };
  },
  mounted() {
    this.setColor(this.color || '#000000');
  },
  methods: {
    setColor(color) {
      this.updateColors(color);
      this.colorValue = color;
    },
    updateColors(color) {
      if (color.slice(0, 1) === '#') {
        this.colors = {
          hex: color,
        };
      } else if (color.slice(0, 4) === 'rgba') {
        const rgba = color.replace(/^rgba?\(|\s+|\)$/g, '').split(',');
        /* eslint no-bitwise: ["error", { "allow": ["<<"] }] */
        const hexVal = ((1 << 24)
          + (parseInt(rgba[0], 10) << 16)
          + (parseInt(rgba[1], 10) << 8)
          + parseInt(rgba[2], 10)).toString(16).slice(1);
        const hex = `#${hexVal}`;

        this.colors = {
          hex,
          a: rgba[3],
        };
      }
    },
    showPicker() {
      this.$nextTick(() => {
        document.addEventListener('click', this.documentClick);
      });
      this.displayPicker = true;
    },
    hidePicker() {
      document.removeEventListener('click', this.documentClick);
      this.displayPicker = false;
    },
    togglePicker() {
      this.displayPicker ? this.hidePicker() : this.showPicker();
    },
    updateFromInput() {
      this.updateColors(this.colorValue);
    },
    updateFromPicker(color) {
      this.colors = color;
      if (color.rgba.a === 1) {
        this.colorValue = color.hex;
      } else {
        this.colorValue = `rgba(${color.rgba.r},${color.rgba.g},${color.rgba.b},${color.rgba.a})`;
      }
    },
    documentClick(e) {
      const el = this.$refs.colorpicker;
      const target = e.target;
      if (el !== target && !el.contains(target)) {
        this.hidePicker();
      }
    },
  },
  watch: {
    colorValue(val) {
      if (val) {
        this.updateColors(val);
        this.$emit('change', val);
      }
    },
  },
};

</script>



<style scoped>

.color-picker {
  width: 100%;

  display: flex;

  & .color-picker-input-container {
    flex: 0 0 70%;
  }

  & .color-picker-preview-container {
    flex: 0 0 30%;
    display: flex;
    align-items: stretch;
    z-index: 5;
  }
}

.current-color {
  display: inline-block;
  width: 100%;
  background-color: #000;
  cursor: pointer;
  border-radius: 5px;
}

#picker {
  position: absolute;
}

</style>
