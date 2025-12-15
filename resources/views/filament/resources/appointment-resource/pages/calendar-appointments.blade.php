<x-filament-panels::page>
    <form wire:submit.prevent class="space-y-6">
        {{ $this->form }}
    </form>

    @foreach ($this->getWidgets() as $widget)
        @livewire($widget, key($widget))
    @endforeach
</x-filament-panels::page>

