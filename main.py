import random
import time
import tkinter as tk
from tkinter import ttk


GRID_SIZE_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10]
APP_TITLE = "舒尔特方格训练"
APP_SUBTITLE = "从 1 开始按顺序点击数字，支持 3x3 到 10x10，覆盖 100 以内数字训练。"
START_BUTTON_TEXT = "开始训练"
SHUFFLE_BUTTON_TEXT = "重新洗牌"
INITIAL_STATUS = "点击“开始训练”后，按顺序找出 1 到 25。"

PALETTE = {
    "bg": "#f4ecdf",
    "hero": "#183847",
    "hero_text": "#fff8ed",
    "hero_muted": "#f5e6ce",
    "panel": "#fffaf2",
    "panel_border": "#d6cab5",
    "text": "#263640",
    "muted": "#6d6257",
    "accent": "#c97827",
    "accent_active": "#ab621b",
    "secondary": "#d7c8b4",
    "secondary_active": "#cdbba2",
    "board": "#ddd3bf",
    "board_inner": "#efe5d3",
    "button": "#fff7ea",
    "button_active": "#efddba",
    "correct": "#86ad76",
    "wrong": "#cb665b",
}

UI = {
    "outer_pad": 16,
    "section_gap": 10,
    "hero_pad_x": 18,
    "hero_pad_y": 14,
    "card_pad_x": 12,
    "card_pad_y": 8,
    "button_pad_x": 16,
    "button_pad_y": 8,
    "board_pad": 8,
    "cell_gap": 6,
    "title_size": 20,
    "subtitle_size": 9,
    "label_size": 10,
    "button_size": 10,
    "status_size": 9,
    "stat_size": 10,
}


class SchulteGridGame:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("920x980")
        self.root.minsize(760, 820)

        self.grid_size_var = tk.IntVar(value=5)
        self.status_var = tk.StringVar(value=INITIAL_STATUS)
        self.timer_var = tk.StringVar(value="0.00 秒")
        self.progress_var = tk.StringVar(value="0 / 25")
        self.best_var = tk.StringVar(value="暂无")

        self.buttons: list[tk.Button] = []
        self.next_number = 1
        self.total_count = 25
        self.start_time = 0.0
        self.elapsed_job: str | None = None
        self.game_active = False
        self.best_times: dict[int, float] = {}

        self._build_ui()
        self._create_grid()

    def _build_ui(self) -> None:
        self.root.configure(bg=PALETTE["bg"])

        container = tk.Frame(self.root, bg=PALETTE["bg"], padx=UI["outer_pad"], pady=UI["outer_pad"])
        container.pack(fill="both", expand=True)

        header = tk.Frame(
            container,
            bg=PALETTE["hero"],
            padx=UI["hero_pad_x"],
            pady=UI["hero_pad_y"],
        )
        header.pack(fill="x")

        tk.Label(
            header,
            text="SCHULTE GRID",
            font=("Microsoft YaHei UI", 9, "bold"),
            fg=PALETTE["hero_muted"],
            bg=PALETTE["hero"],
        ).pack(anchor="w")

        tk.Label(
            header,
            text=APP_TITLE,
            font=("Microsoft YaHei UI", UI["title_size"], "bold"),
            fg=PALETTE["hero_text"],
            bg=PALETTE["hero"],
        ).pack(anchor="w", pady=(4, 0))

        tk.Label(
            header,
            text=APP_SUBTITLE,
            font=("Microsoft YaHei UI", UI["subtitle_size"]),
            fg=PALETTE["hero_muted"],
            bg=PALETTE["hero"],
        ).pack(anchor="w", pady=(6, 0))

        controls = tk.Frame(container, bg=PALETTE["bg"], pady=UI["section_gap"])
        controls.pack(fill="x")

        tk.Label(
            controls,
            text="难度：",
            font=("Microsoft YaHei UI", UI["label_size"], "bold"),
            bg=PALETTE["bg"],
            fg=PALETTE["text"],
        ).pack(side="left")

        size_menu = ttk.Combobox(
            controls,
            textvariable=self.grid_size_var,
            values=GRID_SIZE_OPTIONS,
            state="readonly",
            width=8,
        )
        size_menu.pack(side="left", padx=(0, 10))
        size_menu.bind("<<ComboboxSelected>>", self._on_size_change)

        tk.Button(
            controls,
            text=START_BUTTON_TEXT,
            font=("Microsoft YaHei UI", UI["button_size"], "bold"),
            bg=PALETTE["accent"],
            fg="white",
            activebackground=PALETTE["accent_active"],
            activeforeground="white",
            relief="flat",
            padx=UI["button_pad_x"],
            pady=UI["button_pad_y"],
            command=self.start_game,
            cursor="hand2",
        ).pack(side="left")

        tk.Button(
            controls,
            text=SHUFFLE_BUTTON_TEXT,
            font=("Microsoft YaHei UI", UI["button_size"]),
            bg=PALETTE["secondary"],
            fg=PALETTE["text"],
            activebackground=PALETTE["secondary_active"],
            relief="flat",
            padx=UI["button_pad_x"],
            pady=UI["button_pad_y"],
            command=self.shuffle_only,
            cursor="hand2",
        ).pack(side="left", padx=(8, 0))

        stats = tk.Frame(container, bg=PALETTE["bg"])
        stats.pack(fill="x", pady=(0, 10))

        self._build_stat_card(stats, "用时", self.timer_var).pack(side="left", fill="x", expand=True)
        self._build_stat_card(stats, "进度", self.progress_var).pack(side="left", fill="x", expand=True, padx=8)
        self._build_stat_card(stats, "最佳成绩", self.best_var).pack(side="left", fill="x", expand=True)
        self._build_status_card(stats).pack(side="left", fill="x", expand=True, padx=(8, 0))

        self.grid_frame = tk.Frame(container, bg=PALETTE["board"], padx=UI["board_pad"], pady=UI["board_pad"])
        self.grid_frame.pack(fill="both", expand=True)
        self.grid_frame.bind("<Configure>", self._resize_board)

        self.board_shell = tk.Frame(self.grid_frame, bg=PALETTE["board_inner"])
        self.board_shell.place(relx=0.5, rely=0.5, anchor="center")
        self.board_frame = self._build_board_frame()

    def _build_stat_card(self, parent: tk.Widget, caption: str, text_var: tk.StringVar) -> tk.Frame:
        card = tk.Frame(
            parent,
            bg=PALETTE["panel"],
            padx=UI["card_pad_x"],
            pady=UI["card_pad_y"],
            highlightthickness=1,
            highlightbackground=PALETTE["panel_border"],
        )
        tk.Label(
            card,
            text=caption,
            font=("Microsoft YaHei UI", 8, "bold"),
            bg=PALETTE["panel"],
            fg=PALETTE["muted"],
        ).pack(anchor="w")
        tk.Label(
            card,
            textvariable=text_var,
            font=("Microsoft YaHei UI", UI["stat_size"], "bold"),
            bg=PALETTE["panel"],
            fg=PALETTE["text"],
        ).pack(anchor="w", pady=(4, 0))
        return card

    def _build_status_card(self, parent: tk.Widget) -> tk.Frame:
        card = tk.Frame(
            parent,
            bg=PALETTE["panel"],
            padx=UI["card_pad_x"],
            pady=UI["card_pad_y"],
            highlightthickness=1,
            highlightbackground=PALETTE["panel_border"],
        )
        tk.Label(
            card,
            text="状态",
            font=("Microsoft YaHei UI", 8, "bold"),
            bg=PALETTE["panel"],
            fg=PALETTE["muted"],
        ).pack(anchor="w")
        tk.Label(
            card,
            textvariable=self.status_var,
            font=("Microsoft YaHei UI", UI["status_size"]),
            bg=PALETTE["panel"],
            fg=PALETTE["text"],
            anchor="w",
            justify="left",
            wraplength=240,
        ).pack(anchor="w", pady=(4, 0))
        return card

    def _build_board_frame(self) -> tk.Frame:
        board_frame = tk.Frame(self.board_shell, bg=PALETTE["board_inner"])
        board_frame.pack(fill="both", expand=True)
        return board_frame

    def _resize_board(self, event: tk.Event | None = None) -> None:
        width = event.width if event is not None else self.grid_frame.winfo_width()
        height = event.height if event is not None else self.grid_frame.winfo_height()
        side = max(min(width - UI["board_pad"] * 2, height - UI["board_pad"] * 2), 0)
        self.board_shell.place_configure(width=side, height=side)

    def _grid_font_size(self, size: int) -> int:
        return max(12, min(24, int(31 - size * 1.8)))

    def _on_size_change(self, _event: tk.Event | None = None) -> None:
        self.total_count = self.grid_size_var.get() ** 2
        self.progress_var.set(f"0 / {self.total_count}")
        self.timer_var.set("0.00 秒")
        best_time = self.best_times.get(self.grid_size_var.get())
        self.best_var.set(f"{best_time:.2f} 秒" if best_time is not None else "暂无")
        self.status_var.set(
            f"已切换到 {self.grid_size_var.get()} x {self.grid_size_var.get()}，点击“{START_BUTTON_TEXT}”开始。"
        )
        self.game_active = False
        self._stop_timer()
        self._create_grid()

    def _create_grid(self) -> None:
        self.board_frame.destroy()
        self.board_frame = self._build_board_frame()
        self.grid_frame.update_idletasks()
        self._resize_board()

        self.buttons.clear()
        size = self.grid_size_var.get()
        numbers = list(range(1, size * size + 1))
        random.shuffle(numbers)

        for index in range(size):
            self.board_frame.grid_rowconfigure(index, weight=1, uniform="row")
            self.board_frame.grid_columnconfigure(index, weight=1, uniform="col")

        font_size = self._grid_font_size(size)
        for index, number in enumerate(numbers):
            row = index // size
            column = index % size
            button = tk.Button(
                self.board_frame,
                text=str(number),
                font=("Microsoft YaHei UI", font_size, "bold"),
                bg=PALETTE["button"],
                fg=PALETTE["text"],
                activebackground=PALETTE["button_active"],
                relief="flat",
                bd=0,
                cursor="hand2",
                command=lambda value=number, target_button=None: None,
            )
            button.configure(command=lambda value=number, target_button=button: self.handle_click(value, target_button))
            button.grid(row=row, column=column, sticky="nsew", padx=UI["cell_gap"], pady=UI["cell_gap"])
            self.buttons.append(button)

    def shuffle_only(self) -> None:
        self.game_active = False
        self._stop_timer()
        self.total_count = self.grid_size_var.get() ** 2
        self.next_number = 1
        self.timer_var.set("0.00 秒")
        self.progress_var.set(f"0 / {self.total_count}")
        self.status_var.set(f"方格已重新洗牌，点击“{START_BUTTON_TEXT}”后再计时。")
        self._create_grid()

    def start_game(self) -> None:
        self.total_count = self.grid_size_var.get() ** 2
        self.next_number = 1
        self.game_active = True
        self.start_time = time.perf_counter()
        self.progress_var.set(f"0 / {self.total_count}")
        self.status_var.set(f"训练开始，请先找到数字 {self.next_number}。")
        self._create_grid()
        self._stop_timer()
        self._tick_timer()

    def _tick_timer(self) -> None:
        if not self.game_active:
            return
        elapsed = time.perf_counter() - self.start_time
        self.timer_var.set(f"{elapsed:.2f} 秒")
        self.elapsed_job = self.root.after(50, self._tick_timer)

    def _stop_timer(self) -> None:
        if self.elapsed_job is not None:
            self.root.after_cancel(self.elapsed_job)
            self.elapsed_job = None

    def handle_click(self, value: int, button: tk.Button) -> None:
        if not self.game_active:
            self.status_var.set(f"请先点击“{START_BUTTON_TEXT}”。")
            return

        if value != self.next_number:
            original_color = button.cget("bg")
            button.configure(bg=PALETTE["wrong"], fg="white")
            self.root.after(180, lambda: button.configure(bg=original_color, fg=PALETTE["text"]))
            self.status_var.set(f"当前应点击 {self.next_number}，你点到了 {value}。")
            return

        button.configure(state="disabled", bg=PALETTE["correct"], disabledforeground="white")
        self.progress_var.set(f"{value} / {self.total_count}")

        if value == self.total_count:
            self.finish_game()
            return

        self.next_number += 1
        self.status_var.set(f"正确，继续找到数字 {self.next_number}。")

    def finish_game(self) -> None:
        self.game_active = False
        self._stop_timer()
        elapsed = time.perf_counter() - self.start_time
        self.timer_var.set(f"{elapsed:.2f} 秒")

        size = self.grid_size_var.get()
        best_time = self.best_times.get(size)
        if best_time is None or elapsed < best_time:
            self.best_times[size] = elapsed
            self.best_var.set(f"{elapsed:.2f} 秒")
            self.status_var.set(f"训练完成，用时 {elapsed:.2f} 秒，已刷新当前难度最佳成绩。")
        else:
            self.best_var.set(f"{best_time:.2f} 秒")
            self.status_var.set(f"训练完成，用时 {elapsed:.2f} 秒。")


def main() -> None:
    root = tk.Tk()
    style = ttk.Style(root)
    if "clam" in style.theme_names():
        style.theme_use("clam")
    SchulteGridGame(root)
    root.mainloop()


if __name__ == "__main__":
    main()