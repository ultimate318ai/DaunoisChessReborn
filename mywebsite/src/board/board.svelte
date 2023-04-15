<script lang="ts">
    import { Chess } from 'chess.ts';
    import { fenStore } from '../stores';
    const chess = new Chess($fenStore);


</script>

<button on:click={() => console.log(chess.ascii())}> Click me </button>