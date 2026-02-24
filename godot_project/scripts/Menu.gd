extends CanvasLayer

signal start_game(mode, start_ly)
signal resume_game
signal restart_game
signal exit_game

var background: ColorRect
var container: VBoxContainer
var title_label: Label
var score_label: Label
var high_score_label: Label
var start_coord_input: LineEdit

func _ready():
	# Create background (fullscreen overlay)
	background = ColorRect.new()
	background.color = Color(0, 0, 0, 0.9)
	background.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	# Create main container
	container = VBoxContainer.new()
	container.set_anchors_preset(Control.PRESET_CENTER)
	# Center anchor points
	container.anchor_left = 0.5
	container.anchor_top = 0.5
	container.anchor_right = 0.5
	container.anchor_bottom = 0.5
	# Reset margins to center around anchor
	container.grow_horizontal = Control.GROW_DIRECTION_BOTH
	container.grow_vertical = Control.GROW_DIRECTION_BOTH

	container.add_theme_constant_override("separation", 20)
	add_child(container)

	show_start_screen()

func clear_ui():
	for child in container.get_children():
		child.queue_free()
	background.visible = true

func create_button(text: String, callback: Callable):
	var btn = Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(200, 40)
	btn.flat = false

	# Create a minimalist style
	var style = StyleBoxFlat.new()
	style.bg_color = Color.BLACK
	style.border_color = Color(0.4, 0.4, 0.4) # #666 equivalent
	style.set_border_width_all(1)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 5
	style.content_margin_bottom = 5

	btn.add_theme_stylebox_override("normal", style)
	btn.add_theme_stylebox_override("hover", style)
	btn.add_theme_stylebox_override("pressed", style)
	btn.add_theme_color_override("font_color", Color.WHITE)

	btn.pressed.connect(callback)
	container.add_child(btn)
	return btn

func create_label(text: String, size: int = 16, color: Color = Color.WHITE):
	var label = Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	container.add_child(label)
	return label

func create_slider(label_text: String, bus_name: String):
	var bus_idx = AudioServer.get_bus_index(bus_name)
	if bus_idx == -1: return

	var hbox = HBoxContainer.new()
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER

	var label = Label.new()
	label.text = label_text
	label.custom_minimum_size = Vector2(80, 0)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(label)

	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(10, 0)
	hbox.add_child(spacer)

	var slider = HSlider.new()
	slider.min_value = 0.0
	slider.max_value = 1.0
	slider.step = 0.05
	slider.value = db_to_linear(AudioServer.get_bus_volume_db(bus_idx))
	slider.custom_minimum_size = Vector2(150, 0)
	slider.value_changed.connect(func(val): Global.update_volume(bus_name, val))
	hbox.add_child(slider)

	container.add_child(hbox)

func show_start_screen():
	clear_ui()

	create_label("AIstronaut", 40)
	create_label("TAP & HOLD TO THRUST", 14, Color.LIGHT_GRAY)
	create_label("USE GRAVITY ASSISTS", 14, Color.LIGHT_GRAY)

	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 10)
	container.add_child(spacer)

	create_label("BEST (SURVIVAL): %d LY" % Global.high_score_survival, 14)
	create_label("BEST (ZEN): %d LY" % Global.high_score_zen, 14)

	var spacer2 = Control.new()
	spacer2.custom_minimum_size = Vector2(0, 20)
	container.add_child(spacer2)

	# Start Coord (Dev)
	var hbox = HBoxContainer.new()
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	var lbl = Label.new()
	lbl.text = "START LY:"
	lbl.add_theme_font_size_override("font_size", 12)
	hbox.add_child(lbl)

	start_coord_input = LineEdit.new()
	start_coord_input.placeholder_text = "0"
	start_coord_input.text = "0"
	start_coord_input.custom_minimum_size = Vector2(80, 0)

	# Style input
	var input_style = StyleBoxFlat.new()
	input_style.bg_color = Color.BLACK
	input_style.border_color = Color(0.4, 0.4, 0.4)
	input_style.set_border_width_all(1)
	input_style.content_margin_left = 5
	start_coord_input.add_theme_stylebox_override("normal", input_style)
	start_coord_input.add_theme_stylebox_override("focus", input_style)

	hbox.add_child(start_coord_input)
	container.add_child(hbox)

	create_button("SURVIVAL [FUEL]", func(): _on_start_pressed(0))
	create_button("ZEN [INF]", func(): _on_start_pressed(1))

	var reset_btn = Button.new()
	reset_btn.text = "RESET DATA"
	reset_btn.flat = true
	reset_btn.add_theme_font_size_override("font_size", 10)
	reset_btn.add_theme_color_override("font_color", Color.GRAY)
	reset_btn.pressed.connect(_on_reset_pressed)
	container.add_child(reset_btn)

func show_pause_screen():
	clear_ui()

	create_label("PAUSED", 30)
	create_label("ALTITUDE: %d LY" % Global.score, 20)

	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	container.add_child(spacer)

	create_slider("MASTER", "Master")
	create_slider("MUSIC", "Music")
	create_slider("SFX", "SFX")

	var spacer2 = Control.new()
	spacer2.custom_minimum_size = Vector2(0, 20)
	container.add_child(spacer2)

	create_button("RESUME", func(): resume_game.emit())
	create_button("RESTART", func(): restart_game.emit())
	create_button("EXIT TO MENU", func(): exit_game.emit())

func show_game_over_screen(score: int):
	clear_ui()

	create_label("SIGNAL LOST", 30, Color.RED)
	create_label("DISTANCE", 16)
	create_label("%d LY" % score, 50, Color.WHITE)

	var best = Global.high_score_survival if Global.game_mode == 0 else Global.high_score_zen
	create_label("BEST: %d LY" % best, 14, Color.LIGHT_GRAY)

	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	container.add_child(spacer)

	create_button("RETRY MISSION", func(): restart_game.emit())
	if Global.game_mode == 0:
		create_button("SWITCH TO ZEN", func(): _on_start_pressed(1))
	else:
		create_button("SWITCH TO SURVIVAL", func(): _on_start_pressed(0))

	create_button("EXIT TO MENU", func(): exit_game.emit())

func hide_menu():
	background.visible = false
	for child in container.get_children():
		child.queue_free() # Or just hide container

func _on_start_pressed(mode):
	var start_ly = 0
	if start_coord_input:
		var text = start_coord_input.text.strip_edges()
		if text.is_valid_int():
			start_ly = int(text)
	start_game.emit(mode, start_ly)

func _on_reset_pressed():
	Global.high_score_survival = 0
	Global.high_score_zen = 0
	Global.save_data()
	show_start_screen() # Refresh
