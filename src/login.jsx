import React from 'react';
import Button from './button';

import './login.css';

async function postBasicAuth(endpoint, user, password) {
    if(user.length == 0) {
        return [403, { msg: 'Empty username is invalid' }];
    }
    if(password.length < 5) {
        return [403, { msg: 'Passwords must be at least 5 characters' }];
    }

    const headers = {
        Authorization: 'Basic ' + btoa(`${user}:${password}`)
    };

    const result = await fetch(endpoint, {method: 'POST', headers: headers});
    const body = await result.json();

    return [result.status, body];
}

let user = '';
let pwd = '';

export default function Login({ login, showError }) {

    const inputUser = (e) => user = e.target.value;
    const inputPass = (e) => pwd = e.target.value;

    const query = async function(type) {
        const [status, body] = await postBasicAuth('/api/' + type, user, pwd);
        if(status != 200) {
            if(!('msg' in body)) {
                body.msg = 'Login failed';
            }

            showError(body.msg);
            return false;
        }

        login(user, body.token);
        return true;
    }

    return (
        <main className='center-layout'>
            <div className='login'>
                <h1>SpotCheck<sup><img src='favicon.png'></img></sup></h1>
                <form method='get'>
                    <div>
                        <label htmlFor='username'>Username</label>
                        <input type='text' id='username'
                            onChange={inputUser}></input>
                    </div>
                    <div>
                        <label htmlFor='password'>Password</label>
                        <input type='password' id='password'
                            onChange={inputPass}></input>
                    </div>
                    <Button text='Register'
                        onClick={ () => query('user') } />
                    <Button text='Login'
                        onClick={ () => query('login') } />
                </form>
                <div id='console'></div>
            </div>
        </main>
    );
}
