import knex from '../../knex/knex'
import { EntityType } from '../pages/api/admin/allowed'

const TODO_LIST_TABLE = 'todo_list'

type ActionType = 'remove' | 'add'

export interface TodoItem {
    id: number
    entity_id: number
    entity_name?: string
    type: EntityType
    level?: number
    action: ActionType
}

export const insertTodo = (input: TodoItem[]): Promise<TodoItem[]> => {
    return knex(TODO_LIST_TABLE).returning('*').insert(input)
}

export const deleteTodo = (input: TodoItem): Promise<void> => {
    return knex(TODO_LIST_TABLE).where({ id: input.id }).del()
}

export const listTodo = (): Promise<TodoItem[]> => {
    return knex(TODO_LIST_TABLE)
}
