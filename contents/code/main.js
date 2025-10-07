// These enums do not appear to be exposed to scripts.

// Defined in kwin/src/effect/globals.h
const MaximizeMode = {
    MaximizeRestore: 0,
    MaximizeVertical: 1,
    MaximizeHorizontal: 2,
    MaximizeFull: 3,
};

// Defined in kwin/src/effect/globals.h
const WINDOW_TYPE_NORMAL = 0;

class Keeper {
    constructor() {
        this.registers = [
            null,
            null,
            null,
            null,
            null,
        ];
    }

    get_current_layout() {

        let normal_windows = workspace.windowList()
            .filter((win) => win.windowType === WINDOW_TYPE_NORMAL);

        let stacking_order = normal_windows
            .sort((a, b) => a.stackingOrder - b.stackingOrder)
            .map((win) => win.internalId);
        
        let window_properties = {};
        for (let win of normal_windows) {
            let frame_geometry = {
                x: win.frameGeometry.x,
                y: win.frameGeometry.y,
                width: win.frameGeometry.width,
                height: win.frameGeometry.height,
            };
            let maximize_mode = win.maximizeMode
            let minimized = win.minimized;
            let active = win.active;

            window_properties[win.internalId] = {
                frame_geometry,
                maximize_mode,
                minimized,
                active,
            }
        }

        return {
            stacking_order,
            window_properties,
        };
    }

    save_layout(index) {
        this.registers[index] = this.get_current_layout();
    }

    load_layout_and_save_previous(index) {
        let current_layout = this.get_current_layout();
        this.load_layout(index);
        this.registers[0] = current_layout;
    }

    load_layout(index) {
        if (this.registers[index] === null) return;

        let { stacking_order, window_properties } = this.registers[index];
        let normal_windows = workspace.windowList().filter((win) => win.windowType === 0);
        let windows_by_id = {};
        for (let win of normal_windows) {
            windows_by_id[win.internalId] = win;
        }
        
        for (let id of stacking_order) {
            if (id in windows_by_id) {
                workspace.raiseWindow(windows_by_id[id]);
            }
        }

        for (let win of normal_windows) {
            if (win.internalId in window_properties) {
                let props = window_properties[win.internalId];

                win.frameGeometry = props.frame_geometry;
                win.minimized = props.minimized;
                win.setMaximize(
                    !!(props.maximize_mode & MaximizeMode.MaximizeVertical),
                    !!(props.maximize_mode & MaximizeMode.MaximizeHorizontal),
                );
                if (props.active) {
                    workspace.activeWindow = win;
                }
            }
        }
    }

    generate_shortcut(name, callback) {
        registerShortcut('Sheepdog - ' + name, 'Sheepdog - ' + name, '', callback);
    }
}

let keeper = new Keeper();

keeper.generate_shortcut('Save Layout A', () => keeper.save_layout(1));
keeper.generate_shortcut('Save Layout B', () => keeper.save_layout(2));
keeper.generate_shortcut('Save Layout C', () => keeper.save_layout(3));
keeper.generate_shortcut('Save Layout D', () => keeper.save_layout(4));

keeper.generate_shortcut('Load Layout A', () => keeper.load_layout_and_save_previous(1));
keeper.generate_shortcut('Load Layout B', () => keeper.load_layout_and_save_previous(2));
keeper.generate_shortcut('Load Layout C', () => keeper.load_layout_and_save_previous(3));
keeper.generate_shortcut('Load Layout D', () => keeper.load_layout_and_save_previous(4));

keeper.generate_shortcut('Load Previous', () => keeper.load_layout_and_save_previous(0));

