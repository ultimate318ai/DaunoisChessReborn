<script lang="ts">
    import {fenStore, gameType, startGame} from '../stores';
    let menu_new_game_open: boolean = false;
    let override_fen: boolean = false;

    function triggerMenuNewGame(): void {
        /**
         * Trigger the "new_game" menu when the user clicks on the button.
        */
        menu_new_game_open = !menu_new_game_open;
    }

    function closeMenuAndStartGame(): void {
        /**
         * Close the menu and set the start boolean to true -> make the board visible.
        */
        startGame.set(true);
        triggerMenuNewGame();
    }

</script>
<style>

</style>

<nav class="menu" id="general menu">
    <ol>
        {#if !$startGame}
            <li> <button id="new_game" on:click|trusted={triggerMenuNewGame}> Nouvelle Partie </button></li>
        {/if}
        {#if $startGame}
            <li> <button id="quit" on:click|trusted={() => startGame.set(false)}> Quitter </button></li>
        {/if}
        <li> Charger une partie </li>
        <li> A Propos</li>
    </ol>
</nav>

{#if menu_new_game_open}
    <form action="" method="dialog" class="new_game_form">
        <div class="form-control">
            <label for="user_name"> Enter Your Name</label>
            <input type="text" name="user_name" id="user_name" required>
        </div>
        <div class="form-control">
            <label for="select_game"> Game type</label>
            <select name="game_type" id="select_game" bind:value={$gameType}>
                <option value="">--Please choose an option--</option>
                <option value="chess">Chess</option>
            </select>
        </div>
        <div class="form-control">
            <label for="fen"> Special Fen</label>
            <input type="checkbox" name="fen" id="fen" bind:checked={override_fen}>
        </div>
        {#if override_fen}
        <div class="form-control">
            <label for="fen">Fen : </label>
            <input type="text" name="fen_text" id="fen_text" bind:value={$fenStore}>
        </div>
        {/if}
        <div class="form-control">
            <input type="submit" value="Start Game" on:click|trusted={closeMenuAndStartGame}>
        </div>
    </form>
{/if}