/*==========================================================
=
=   WpMoveAdapter
=
==========================================================*/

class WpMoveAdapter {

    constructor(vc, tree, bus) {

        this.vc = vc;
        this.tree = tree;
        this.bus = bus;

    }

    /*======================================================
    =
    =  PUBLIC
    =
    ======================================================*/

    move(session) {

        const sourceView = this.getView(session.model);
        const targetView = this.getView(session.target);

        if (!sourceView || !targetView) {
            return false;
        }

        const $source = sourceView.$el;
        const $target = targetView.$el;

        if (
            !$source.length ||
            !$target.length
        ) {
            return false;
        }

        const destination = this.resolveDestination(
            $target,
            session.position
        );

        if (!destination) {
            return false;
        }

        this.beginTransaction();

        this.moveDom(
            $source,
            destination,
            session.position
        );

        this.syncModel(
            session.model,
            destination.container
        );

        this.finishTransaction();

        this.notify(session);

        return true;

    }

    /*======================================================
    =
    =  LOOKUPS
    =
    ======================================================*/

    getView(model) {

        return this.vc.app.views[
            model.get("id")
        ];

    }

    getModel(id) {

        return this.tree.getModel(id);

    }

    /*======================================================
    =
    =  DESTINATION
    =
    ======================================================*/

    resolveDestination(
        $target,
        position
    ) {

        if (position === "inside") {

            let container =
                $target
                    .children(".wpb_element_wrapper")
                    .children(".wpb_column_container");

            if (!container.length) {

                container =
                    $target.find(
                        ".wpb_column_container"
                    ).first();

            }

            if (!container.length) {
                return null;
            }

            return {

                container,

                reference: null,

                parentId:
                    $target.data("model").id

            };

        }

        const container =
            $target.parent();

        return {

            container,

            reference: $target,

            parentId:
                this.findParentId(container)

        };

    }

    /*======================================================
    =
    =  DOM
    =
    ======================================================*/

    moveDom(
        $source,
        destination,
        position
    ) {

        switch (position) {

            case "before":

                destination.reference.before(
                    $source
                );

                break;

            case "after":

                destination.reference.after(
                    $source
                );

                break;

            case "inside":

                destination.container.append(
                    $source
                );

                break;

        }

    }

    /*======================================================
    =
    =  BACKBONE
    =
    ======================================================*/

    syncModel(
        model,
        container
    ) {

        const parentId =
            this.findParentId(container);

        this.updateParent(
            model,
            parentId
        );


        

        this.updateOrders(
            container
        );

        this.saveStorage();

    }

    updateParent(
        model,
        parentId
    ) {

        const current =
            model.get("parent_id");

        if (current === parentId) {
            return;
        }

        model.save({

            parent_id: parentId

        });

    }

    updateOrders(container) {

        container
            .children("[data-model-id]")
            .each(function(index){
               
                const model =
                    jQuery(this)
                        .data("model");
        
         
            
                if (!model) {
                    return;
                }

                if (
                    model.get("order") === index
                ) {
                    return;
                }

                model.save({
                    order: index
                });

            });

    }

    /*======================================================
    =
    =  HELPERS
    =
    ======================================================*/

    findParentId(container) {

        const parent =
            container.closest(
                "[data-model-id]"
            );

      

        if (!parent.length) {
            return false;
        }

        const model =
            parent.data("model");

        return model
            ? model.id
            : false;

    }

    refreshSortable(container) {

        if (
            container &&
            container.data("ui-sortable")
        ) {

         
            container.sortable(
                "refresh"
            );

            container.sortable(
                "refreshPositions"
            );

        }

    }

    saveStorage() {

        this.vc.storage.save();

    }

    beginTransaction() {

        if (
            this.vc.storage.lock
        ) {

            this.vc.storage.lock();

        }

    }

    finishTransaction() {

        if (
            this.vc.storage.unlock
        ) {

            this.vc.storage.unlock();

        }

        this.vc.app.setSortable();

    }

    /*======================================================
    =
    =  EVENTS
    =
    ======================================================*/

    notify(session) {

        this.tree.rebuild();

        this.bus.trigger(
            "tree:changed"
        );

        this.bus.trigger(
            "selection:changed",
            session.model.id
        );

        this.bus.trigger(
            "scroll:reveal",
            session.model.id
        );

    }

}