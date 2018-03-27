<template>

  <div
    @drag.prevent.stop
    @dragstart.prevent.stop
    @dragend.prevent.stop
    @dragexit.prevent.stop
    @dragover.prevent.stop
    @dragenter.prevent.stop="isDragover = true"
    @dragleave.prevent.stop="isDragover = false"
    @drop.prevent.stop="handleDrop"
    :class="{ 'is-dragover': isDragover, 'is-loading': isLoading }"
    ref="dropzone"
    class="box"
    >
    <div class="box__input">

      <input
        @change.prevent.stop="handleInput"
        type="file"
        name="fileInput"
        id="fileInput"
        ref="fileInput"
        accept=".json"
        class="box__file"
        multiple
      />
      <span v-show="!isLoading && !isError">
        <label class="box__label" for="fileInput"><strong>Choose files,</strong></label>
        <span>drop files, or paste a URL.</span>
      </span>

    </div>

    <div class="text-area" v-show="isLoading">Loading&hellip;</div>
    <div class="text-area" v-show="isError">
      <span style="color:red;">Error!</span>
      {{errMsg}}.
    </div>
  </div>

</template>



<script>
export default {
  name: 'Dropzone',
  data() {
    return {
      isDragover: false,
      isLoading: false,
      isError: false,
      errMsg: '',
      msgTimeoutMS: 2500,
    };
  },
  methods: {
    handleDrop(e) {
      this.isDragover = false;
      const files = Array.from(e.dataTransfer.files);
      if (files.some(file => file.type !== 'application/json')) {
        this.isError = true;
        this.errMsg = 'Invalid file type (JSON only)';
        setTimeout(() => { this.isError = false; this.errMsg = ''; }, this.msgTimeoutMS);
      } else {
        this.handleFiles(files);
      }
    },
    handleInput() {
      this.handleFiles(Array.from(this.$refs.fileInput.files));
    },
    handleFiles(files) {
      if (this.isLoading) return;
      this.isError = false;
      this.isLoading = true;


      const readFileAsJSON = (file) => {
        const fileReader = new FileReader();
        return new Promise((resolve, reject) => {
          fileReader.onerror = () => {
            // eslint-disable-next-line
            console.warn(`File: "${file.name}"\n${fileReader.error}`);
            fileReader.abort();
            reject(fileReader.error);
          };

          fileReader.onload = () => {
            try {
              const data = JSON.parse(fileReader.result);
              resolve(data);
            } catch (e) {
              // eslint-disable-next-line
              console.warn(`File: "${file.name}"\n${e.message}`);
              reject(e.message);
            }
          };

          fileReader.readAsText(file);
        });
      };

      Promise.all(files.map(readFileAsJSON))
        .then((values) => {
          this.isLoading = false;
          this.$emit('data', values);
        }).catch((reason) => {
          this.isLoading = false;
          this.isError = true;
          this.errMsg = reason;

          setTimeout(() => { this.isError = false; this.errMsg = ''; }, this.msgTimeoutMS);
        });
    },
  },
};
</script>



<style scoped>

.box {
  background-color: 'white';
  border: medium dashed gray;
  border-radius: 10px;

  line-height: 1.2rem;
  text-align: center;

  margin: 20px;

  display: flex;
  align-items: center;
  justify-content: center;

  &.is-dragover {
    opacity: 0.5;
  }
  &.is-loading .box__input {
    visibility: none;
  }
  &.is-loading .box__loading {
    display: block;
  }

  & .text-area {
    margin: 0 1.5rem;
  }

  & input {
    display: none;
  }

  & .box__label {
    cursor: pointer;
    color: #2979FF;

    &:hover {
      color: blue;
    }
  }
}

</style>
