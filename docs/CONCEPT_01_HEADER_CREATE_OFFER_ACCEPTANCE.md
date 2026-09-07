# FacadeFlow — Concept 01 acceptance

## Goal

Start the new FacadeFlow application from a clean codebase. The old `FacadeFlow-Demo` remains a training/reference project and is not migrated into this repository.

## UI boundary

The application header deliberately preserves the visual language of the training version:

- Nadezhda brand logo;
- dark technical grid background;
- cyan/orange accent rule;
- compact technical action styling.

The new header contains exactly one primary product action: **Създай оферта**.

The old navigation is intentionally absent:

- AI;
- Конструктор;
- Импорт;
- Проекти;
- Каталог;
- Помощ.

## First workflow boundary

`Създай оферта` opens only the first empty workflow shell:

**Нова оферта → Клиент / Обект**

No client fields, object fields, system selection, glazing, hardware or modules are modeled yet. Those will be introduced only after the real business process is defined.

## Concept sequence

1. Клиент / Обект
2. Оферта
3. Система / цвят / стъкло / обков / общи условия
4. Модул 1 / Модул 2 / Модул 3 / ...

This sequence is conceptual only in Concept 01; only the entry point is implemented.
