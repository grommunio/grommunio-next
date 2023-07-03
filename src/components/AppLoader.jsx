import logo from '../res/grommunio_logo.png';


export default function AppLoader() {
  return <div style={{ display: 'flex', flex: 1, justifyContent: "center", alignItems: "center"}}>
    <img src={logo} width={100} />
  </div>
}