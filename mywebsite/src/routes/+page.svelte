<script lang="ts">
    import Board from "../board/board.svelte";
    import GeneralMenu from "../menu/general_menu.svelte";
    import { startGame } from "../stores";
</script>

<style>


</style>
<GeneralMenu></GeneralMenu>

{#if $startGame}
    <Board></Board>
{/if}


<h1> Bienvenue sur mon site D'Echecs </h1>


