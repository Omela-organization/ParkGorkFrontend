<template>
  <RouterView v-slot="{ Component }">
    <Transition name="fade-fast" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
</template>

<style>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity .15s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to   { opacity: 0 }
</style>
