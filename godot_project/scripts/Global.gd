extends Node

var score: int = 0
var high_score_survival: int = 0
var high_score_zen: int = 0
var game_mode: int = 0 # 0: Survival, 1: Zen
var is_game_over: bool = false
var is_paused: bool = false

# Settings (0.0 to 1.0)
var volume_master: float = 1.0
var volume_music: float = 1.0
var volume_sfx: float = 1.0

func _ready():
	load_data()
	# Ensure audio buses exist or handle errors gracefully
	# Usually buses are defined in default_bus_layout.tres, but we can set volume by index if they exist
	# Default Master always exists (0)

func save_data():
	var file = FileAccess.open("user://savegame.save", FileAccess.WRITE)
	var data = {
		"survival": high_score_survival,
		"zen": high_score_zen
	}
	file.store_string(JSON.stringify(data))

func load_data():
	if FileAccess.file_exists("user://savegame.save"):
		var file = FileAccess.open("user://savegame.save", FileAccess.READ)
		var json = JSON.new()
		var error = json.parse(file.get_as_text())
		if error == OK:
			var data = json.data
			high_score_survival = data.get("survival", 0)
			high_score_zen = data.get("zen", 0)

func update_volume(bus_name: String, value: float):
	var bus_idx = AudioServer.get_bus_index(bus_name)
	if bus_idx != -1:
		AudioServer.set_bus_volume_db(bus_idx, linear_to_db(value))

		# Save specific volume state locally if needed
		if bus_name == "Master": volume_master = value
		elif bus_name == "Music": volume_music = value
		elif bus_name == "SFX": volume_sfx = value
