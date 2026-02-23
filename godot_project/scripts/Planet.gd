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
	elif type == "asteroid":
		mass = 0.0
		gravity_radius = 0.0
	elif type == "star":
		mass *= 4.0
		gravity_radius = radius * 6.0 # Larger gravity field

	queue_redraw()

func _draw():
	if type == "asteroid":
		draw_circle(Vector2.ZERO, radius, Color(0.4, 0.4, 0.4))
		draw_circle(Vector2.ZERO, radius * 0.3, Color(0.3, 0.3, 0.3)) # Texture detail
		return

	draw_circle(Vector2.ZERO, radius, get_color_for_type())

	# Star Danger Zone
	if type == "star":
		# Draw Red Dashed Line at 1/3 Gravity Radius
		var danger_rad = gravity_radius / 3.0
		draw_arc_dashed(Vector2.ZERO, danger_rad, 0, TAU, 24, Color(1, 0, 0, 0.8), 2.0)

	# Black Hole visuals
	if type == "black_hole":
		draw_circle(Vector2.ZERO, radius * 0.8, Color.BLACK)
		draw_arc(Vector2.ZERO, radius, 0, TAU, 32, Color.WHITE, 2.0)

func draw_arc_dashed(center, radius, start_angle, end_angle, point_count, color, width):
	var angle_step = (end_angle - start_angle) / point_count
	for i in range(point_count):
		if i % 2 == 0:
			var angle = start_angle + i * angle_step
			var next_angle = start_angle + (i + 1) * angle_step
			draw_arc(center, radius, angle, next_angle, 4, color, width)

func get_color_for_type() -> Color:
	match type:
		"dead": return Color.GRAY
		"ocean": return Color.BLUE
		"ice": return Color.LIGHT_BLUE
		"desert": return Color.ORANGE
		"gas_giant": return Color.ORANGE_RED
		"black_hole": return Color.BLACK
		"star": return Color.LIGHT_YELLOW
		"asteroid": return Color.DIM_GRAY
		_: return Color.WHITE
