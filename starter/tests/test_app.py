from app import app


def test_app_starts_and_index_returns_ok():
    app.config['TESTING'] = True

    with app.test_client() as client:
        response = client.get('/')

    assert response.status_code == 200


def test_new_game_uses_difficulty_clue_counts():
    app.config['TESTING'] = True

    with app.test_client() as client:
        for difficulty, expected_clues in [('easy', 45), ('medium', 35), ('hard', 25)]:
            response = client.get('/new', query_string={'difficulty': difficulty})
            puzzle = response.get_json()['puzzle']
            actual_clues = sum(cell != 0 for row in puzzle for cell in row)

            assert response.status_code == 200
            assert actual_clues == expected_clues


def test_new_game_rejects_unknown_difficulty():
    app.config['TESTING'] = True

    with app.test_client() as client:
        response = client.get('/new', query_string={'difficulty': 'expert'})

    assert response.status_code == 400


def test_hint_returns_an_empty_cell_value():
    app.config['TESTING'] = True

    with app.test_client() as client:
        client.get('/new', query_string={'difficulty': 'easy'})
        response = client.get('/hint')
        second_response = client.get('/hint')

    hint = response.get_json()
    second_hint = second_response.get_json()
    assert response.status_code == 200
    assert hint['value'] != 0
    assert (hint['row'], hint['col']) != (second_hint['row'], second_hint['col'])

def test_check_solution_rejects_malformed_board_payloads():
    app.config['TESTING'] = True

    with app.test_client() as client:
        client.get('/new', query_string={'difficulty': 'easy'})
        response = client.post('/check', json={'board': [[1, 2], [3, 4]]})

    assert response.status_code == 400
    assert response.get_json()['error'] == 'Invalid board payload'
