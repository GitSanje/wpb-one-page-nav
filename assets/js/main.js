(function () {
    const init = () => {
        if (window.__opnNavInitialized || window.__opnNavInitializing) {
            return;
        }

        const vc = window.vc;

        if (!vc || !vc.shortcodes || !vc.app || !vc.storage) {
            return;
        }

        window.__opnNavInitializing = true;

        try {
            const tree = new TreeRepository(vc);
            const state = new SidebarState();
            const bus = window.__opnBus || (window.__opnBus = new EventBus());

            const navbar = new Navbar(tree, state, bus);
            const manager = new DragDropManager(
                vc,
                tree,
                navbar,
                state,
                bus
            );
            const adapter = new WpMoveAdapter(vc, tree, bus);

            manager.setAdapter(adapter);
            navbar.init();
            manager.bind();

            document.addEventListener("click", (event) => {
                const row = event.target.closest('[data-model-id][data-element_type="vc_row"]');

                if (!row)
                    return;

                const id = row.dataset.modelId;

                if (!id)
                    return;

                state.select(id);
                bus.trigger("selection:changed", id);
            });

            bus.on("tree:changed", () => {
                tree.rebuild();
                navbar.render();
            });

            vc.shortcodes.on(
                "add remove change:parent_id change:order",
                () => {
                    tree.rebuild();
                    bus.trigger("tree:changed");
                }
            );

            window.__opnNavInitialized = true;
        } catch (error) {
            console.warn("WPBakery one-page-nav initialization failed:", error);
        } finally {
            window.__opnNavInitializing = false;
        }
    };

    const scheduleInit = (attempt = 0) => {
        if (window.__opnNavInitialized || window.__opnNavInitializing) {
            return;
        }

        const vc = window.vc;

        if (vc && vc.shortcodes && vc.app && vc.storage) {
            window.setTimeout(init, 300);
            return;
        }

        if (attempt < 25) {
            window.setTimeout(() => scheduleInit(attempt + 1), 300);
            return;
        }

        console.warn("WPBakery one-page-nav: editor environment did not become ready in time.");
    };

    const start = () => {
        window.setTimeout(() => scheduleInit(0), 500);
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
