extends Area2D
class_name Planet

@export var radius: float = 30.0
@export var type: String = "ice"
var mass: float = 1.0
var gravity_radius: float = 0.0

func _ready():
	add_to_group("planets")
	gravity_radius = radius * GameConfig.GRAVITY_RADIUS_SCALE
	mass = radius * radius # Mass proportional to area (2D)

	if type == "gas_giant":
		mass *= 2.0
	elif type == "black_hole":
		mass *= 4.0

	queue_redraw()

func _draw():
	draw_circle(Vector2.ZERO, radius, get_color_for_type())

	# Optional: Draw Gravity Radius (Debug or Style)
	# draw_arc(Vector2.ZERO, gravity_radius, 0, TAU, 32, Color(1,1,1,0.05), 1.0)

	# Black Hole visuals
	if type == "black_hole":
		draw_circle(Vector2.ZERO, radius * 0.8, Color.BLACK)
		draw_arc(Vector2.ZERO, radius, 0, TAU, 32, Color.WHITE, 2.0)

func get_color_for_type() -> Color:
	match type:
		"dead": return Color.GRAY
		"ocean": return Color.BLUE
		"ice": return Color.LIGHT_BLUE
		"desert": return Color.ORANGE
		"gas_giant": return Color.ORANGE_RED
		"black_hole": return Color.BLACK
		_: return Color.WHITE
