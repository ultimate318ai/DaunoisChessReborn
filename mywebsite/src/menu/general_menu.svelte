<script lang="ts">
    let menu_new_game_open: boolean = false;
    let override_fen: boolean = false;
    export let fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    function trigger_menu_new_game(): any {
        /**
         * Trigger the "new_game" menu when the user clicks on the button.
        */
        menu_new_game_open = !menu_new_game_open;
    }

</script>
<style>

</style>

<nav class="menu" id="general menu">
    <ol>
        <li> <button id="new_game" on:click|trusted={trigger_menu_new_game}> Nouvelle Partie </button></li>
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
            <select name="game_type" id="select_game">
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
            <input type="text" name="fen_text" id="fen_text" value={fen}>
        </div>
        {/if}
        <div class="form-control">
            <input type="submit" value="Start Game">
        </div>
    </form>
{/if}