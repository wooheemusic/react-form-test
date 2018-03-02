import React, { Component } from 'react'
import { Button } from 'reactstrap'
import Input from 'components/input'


/**
 * 필연적인 조건
submit event발생 시, 모든 validation은 완료되어 있어야 합니다.

제시된 조건
validation은 input blur event가 수행합니다.
message의 결정은 input render에서 합니다.

리펙토링의 이유 : React의 전략에 반합니다.
blur event에서의 validation result는 form submit event발생 시 form component가 알고 있어야하므로  single source of truth 전략에 의해 lifting해야합니다. blur event가 아니더라도 어떠한 validation이든 결과가 lifting되어야 하므로, render method안에서 사용할 수 없습니다. (무한루프)

리펙토링 제안 : 
validation과 messaging을 분리합니다.
그리고 Input과 form은 결합도가 높으므로 form은 extend해서 사용하도록 합니다.

새로운 이슈:
submit event 발생 시, validation이 각 항목에 관해 모두 수행되지 않았을 때, 각 항목들이 required 여부에 따라서 validation result가 없어도 validation을 결정할 수 있어야 합니다. 
 이 경우는, Input의 attr에 [‘required’ , ‘vpc’] 형태로 구현해서는 안되며, form의 constructor에서 this.state = {validations : { username : [‘required’ , ‘email’] }, … }, input attr에서 validation={this.state.validations}과 같이 정의하여, form이 Input의 validation 설정을 읽을 수 있게 하고, 아직 validation을 하지 않은 각 input 항목에 관해 required를 체크하여 submit 가능 여부를 체크하여야 할 것입니다.
  아니면 그냥 componentDidMount에서 하면 되겠군요;

그런데 만약에 자동완성이 구현되어 있다면, 그 항목에 관하여 validation이 수행되어야하는데, 아직 blur event에 validation이 수행되어 있지않았다면, input안에 정의된 validation에 관련된 method를 수행해야하는데, 이 때 그 method를 수행하는 한가지 방법은, form component에서 render를 수행하여 input의 render를 수행하게 하는 것인데, render method안에서는 위에서 언급한 lifting이 불가한 이유로 validation을 수행 할 수 없습니다. 이 경우는 Input componentDidMount를 이용하여 validation을 수행해야 할 것입니다.
 * 
 * 
 */
export default class Form extends Component {

  constructor(props) {
    super(props)
    this.onSubmit = this.onSubmit.bind(this)
    this.onValueChange = this.onValueChange.bind(this)
    this.onValidationChange = this.onValidationChange.bind(this)

    this.state = {
      submitted: false,
      username: 'www@eeee',
      password: '22',
      validationResults: {}
    }
  }

  onValueChange(name, value) {
    this.setState(() => ({ [name]: value }))
  }

  onValidationChange(name, validity) {
    this.setState((prev) => {
      let validationResults = Object.assign(prev.validationResults, { [name]: validity })
      return { validationResults }
    })
  }

  async onSubmit(e) {
    e.preventDefault();
    console.log('Form submitted', e.target)
    this.setState({ submitted: true })
    console.log(await this.state.validationResults.password)
    console.log(await this.state.validationResults.username)
    console.log('submitted value after \'setState\' but before this frame ends :', this.state.submitted)
    console.log('ajax call is excuted here. The whole validation should be done before this statement.')
  }

  render() {
    console.log('Form render, this.state.validationResults :', this.state.validationResults)
    return (
      <form onSubmit={this.onSubmit}>
        <Input name="username" value={this.state.username} validity={this.state.validationResults.username} submitted={this.state.submitted} onValueChange={this.onValueChange} onValidationChange={this.onValidationChange} />
        <Input name="password" value={this.state.password} validity={this.state.validationResults.password} submitted={this.state.submitted} onValueChange={this.onValueChange} onValidationChange={this.onValidationChange} />
        <Button> submit </ Button>
      </form>
    )
  }
}
